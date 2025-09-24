import { create } from "zustand";

export interface Process {
  pid: number;
  arrivalTime: number;
  duration: number;
  remainingTime: number;
  startTime?: number;
  completionTime?: number;
  waitingTime?: number;
  turnaroundTime?: number;
  state: "waiting" | "ready" | "running" | "completed";
}

export type SchedulingAlgorithm = "FIFO" | "LIFO" | "SJF" | "LJF";

interface StateSnapshot {
  processes: Process[];
  currentTick: number;
  currentProcess: Process | null;
  readyQueue: Process[];
  completedProcesses: Process[];
}

interface SchedulerState {
  processes: Process[];
  currentTick: number;
  currentProcess: Process | null;
  readyQueue: Process[];
  completedProcesses: Process[];
  algorithm: SchedulingAlgorithm;
  history: StateSnapshot[];

  setAlgorithm: (algorithm: SchedulingAlgorithm) => void;
  addProcesses: (processes: Process[]) => void;
  generateRandomProcesses: (count: number) => void;
  loadProcessesFromText: (text: string) => void;
  nextStep: () => void;
  previousStep: () => void;
}

const createProcess = (process: Partial<Process>): Process =>
  ({
    remainingTime: process.duration || 0,
    state: "waiting",
    ...process,
  } as Process);

const sortQueue = (
  queue: Process[],
  algorithm: SchedulingAlgorithm
): Process[] => {
  const sorted = [...queue];

  const sorters = {
    FIFO: (a: Process, b: Process) =>
      a.arrivalTime - b.arrivalTime || a.pid - b.pid,
    LIFO: (a: Process, b: Process) =>
      b.arrivalTime - a.arrivalTime || b.pid - a.pid,
    SJF: (a: Process, b: Process) =>
      a.remainingTime - b.remainingTime ||
      a.arrivalTime - b.arrivalTime ||
      a.pid - b.pid,
    LJF: (a: Process, b: Process) =>
      b.remainingTime - a.remainingTime ||
      a.arrivalTime - b.arrivalTime ||
      a.pid - b.pid,
  };

  return sorted.sort(sorters[algorithm]);
};

const resetProcess = (p: Process): Process => ({
  ...p,
  remainingTime: p.duration,
  state: "waiting",
  startTime: undefined,
  completionTime: undefined,
  waitingTime: undefined,
  turnaroundTime: undefined,
});

const initialState = {
  processes: [],
  currentTick: 0,
  currentProcess: null,
  readyQueue: [],
  completedProcesses: [],
  algorithm: "FIFO" as SchedulingAlgorithm,
  history: [],
};

export const useSchedulerStore = create<SchedulerState>((set, get) => ({
  ...initialState,

  setAlgorithm: (algorithm) => {
    const { processes } = get();
    const shouldReset = processes.length > 0;

    set({
      algorithm,
      ...(shouldReset && {
        processes: processes.map(resetProcess),
        currentTick: 0,
        currentProcess: null,
        readyQueue: [],
        completedProcesses: [],
        history: [],
      }),
    });
  },

  addProcesses: (processes) => {
    const processesWithState = processes.map(createProcess);
    set({
      processes: processesWithState,
      currentTick: 0,
      currentProcess: null,
      readyQueue: [],
      completedProcesses: [],
      history: [],
    });
  },

  generateRandomProcesses: (count) => {
    const processes = Array.from({ length: count }, (_, i) =>
      createProcess({
        pid: i + 1,
        arrivalTime: Math.floor(Math.random() * 8) + 1,
        duration: Math.floor(Math.random() * 6) + 2,
      })
    );
    get().addProcesses(processes);
  },

  loadProcessesFromText: (text) => {
    const processes = text
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => {
        const [pid, arrivalTime, duration] = line
          .trim()
          .split(/[\s,]+/)
          .filter((part) => part.trim())
          .map(Number);

        return createProcess({
          pid: pid || index + 1,
          arrivalTime: Math.max(1, arrivalTime || 1),
          duration: Math.max(1, duration || 1),
        });
      });

    if (processes.length > 0) {
      get().addProcesses(processes);
    }
  },

  nextStep: () => {
    const state = get();

    if (
      state.processes.every((p) => p.state === "completed") &&
      !state.currentProcess &&
      state.readyQueue.length === 0
    ) {
      return;
    }

    // Guardar estado actual en historial
    const snapshot: StateSnapshot = {
      processes: state.processes.map((p) => ({ ...p })),
      currentTick: state.currentTick,
      currentProcess: state.currentProcess ? { ...state.currentProcess } : null,
      readyQueue: state.readyQueue.map((p) => ({ ...p })),
      completedProcesses: state.completedProcesses.map((p) => ({ ...p })),
    };

    const newTick = state.currentTick + 1;
    const processes = state.processes.map((p) => ({ ...p }));
    let currentProcess = state.currentProcess
      ? { ...state.currentProcess }
      : null;
    const completedProcesses = [...state.completedProcesses];
    let readyQueue: Process[] = [];

    // Procesar proceso actual
    if (currentProcess) {
      currentProcess.remainingTime--;

      const processIndex = processes.findIndex(
        (p) => p.pid === currentProcess!.pid
      );
      if (processIndex !== -1) {
        processes[processIndex] = { ...currentProcess };
      }

      if (currentProcess.remainingTime <= 0) {
        currentProcess.completionTime = newTick;
        currentProcess.turnaroundTime = newTick - currentProcess.arrivalTime;
        currentProcess.waitingTime =
          currentProcess.turnaroundTime - currentProcess.duration;
        currentProcess.state = "completed";

        if (!completedProcesses.find((p) => p.pid === currentProcess!.pid)) {
          completedProcesses.push({ ...currentProcess });
        }

        if (processIndex !== -1) {
          processes[processIndex] = { ...currentProcess };
        }

        currentProcess = null;
      }
    }

    // Construir cola de listos
    processes.forEach((process) => {
      const hasArrived = process.arrivalTime <= newTick;
      const isNotCompleted = process.state !== "completed";
      const isNotRunning =
        !currentProcess || currentProcess.pid !== process.pid;

      if (hasArrived && isNotCompleted && isNotRunning) {
        const readyProcess = { ...process, state: "ready" as const };
        readyQueue.push(readyProcess);

        const index = processes.findIndex((p) => p.pid === process.pid);
        if (index !== -1 && processes[index].state !== "completed") {
          processes[index].state = "ready";
        }
      } else if (!hasArrived && process.state !== "completed") {
        const index = processes.findIndex((p) => p.pid === process.pid);
        if (index !== -1) processes[index].state = "waiting";
      }
    });

    // Ordenar y asignar nuevo proceso
    readyQueue = sortQueue(readyQueue, state.algorithm);

    if (!currentProcess && readyQueue.length > 0) {
      currentProcess = { ...readyQueue[0], state: "running" };
      currentProcess.startTime = currentProcess.startTime || newTick;

      readyQueue = readyQueue.filter((p) => p.pid !== currentProcess!.pid);

      const index = processes.findIndex((p) => p.pid === currentProcess!.pid);
      if (index !== -1) processes[index] = { ...currentProcess };
    }

    set({
      currentTick: newTick,
      processes,
      readyQueue,
      currentProcess,
      completedProcesses,
      history: [...state.history, snapshot],
    });
  },

  previousStep: () => {
    const { history } = get();
    if (history.length === 0) return;

    const previousState = history[history.length - 1];

    set({
      ...previousState,
      history: history.slice(0, -1),
    });
  },
}));
