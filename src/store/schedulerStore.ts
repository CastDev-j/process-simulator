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
  state: "waiting" | "ready" | "running" | "completed" | "blocked";
  quantumRemaining?: number;
}

export type SchedulingAlgorithm = "FIFO" | "LIFO" | "SJF" | "LJF" | "RR_LIFO";

interface StateSnapshot {
  processes: Process[];
  currentTick: number;
  currentProcess: Process | null;
  readyQueue: Process[];
  completedProcesses: Process[];
  blockedProcesses: Process[];
}

interface SchedulerState {
  processes: Process[];
  currentTick: number;
  currentProcess: Process | null;
  readyQueue: Process[];
  completedProcesses: Process[];
  blockedProcesses: Process[];
  algorithm: SchedulingAlgorithm;
  quantum: number;
  history: StateSnapshot[];

  setAlgorithm: (algorithm: SchedulingAlgorithm) => void;
  setQuantum: (quantum: number) => void;
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
    RR_LIFO: (a: Process, b: Process) =>
      b.arrivalTime - a.arrivalTime || b.pid - a.pid,
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
  blockedProcesses: [],
  algorithm: "FIFO" as SchedulingAlgorithm,
  quantum: 3,
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
        blockedProcesses: [],
        history: [],
      }),
    });
  },

  setQuantum: (quantum) => {
    set({ quantum });
  },

  addProcesses: (processes) => {
    const processesWithState = processes.map(createProcess);
    set({
      processes: processesWithState,
      currentTick: 0,
      currentProcess: null,
      readyQueue: [],
      completedProcesses: [],
      blockedProcesses: [],
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
      state.readyQueue.length === 0 &&
      state.blockedProcesses.length === 0
    ) {
      return;
    }

    const snapshot: StateSnapshot = {
      processes: state.processes.map((p) => ({ ...p })),
      currentTick: state.currentTick,
      currentProcess: state.currentProcess ? { ...state.currentProcess } : null,
      readyQueue: state.readyQueue.map((p) => ({ ...p })),
      completedProcesses: state.completedProcesses.map((p) => ({ ...p })),
      blockedProcesses: state.blockedProcesses.map((p) => ({ ...p })),
    };

    const newTick = state.currentTick + 1;
    const processes = state.processes.map((p) => ({ ...p }));
    let currentProcess = state.currentProcess
      ? { ...state.currentProcess }
      : null;
    const completedProcesses = [...state.completedProcesses];
    let readyQueue: Process[] = [];
    let blockedProcesses = [...state.blockedProcesses];

    const isRoundRobin = state.algorithm === "RR_LIFO";

    // --- INICIO PROCESAMIENTO DEL PROCESO ACTUAL ---
    if (currentProcess) {
      currentProcess.remainingTime--;

      if (isRoundRobin && currentProcess.quantumRemaining !== undefined) {
        currentProcess.quantumRemaining--;
      }

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
      } else if (isRoundRobin && currentProcess.quantumRemaining === 0) {
        currentProcess.state = "blocked";
        currentProcess.quantumRemaining = state.quantum;

        if (processIndex !== -1) {
          processes[processIndex] = { ...currentProcess };
        }

        if (!blockedProcesses.find((p) => p.pid === currentProcess!.pid)) {
          blockedProcesses.push({ ...currentProcess });
        }

        currentProcess = null;
      }
    }
    // --- FIN PROCESAMIENTO DEL PROCESO ACTUAL ---

    processes.forEach((process) => {
      const hasArrived = process.arrivalTime <= newTick;
      const isNotCompleted = process.state !== "completed";
      const isNotRunning =
        !currentProcess || currentProcess.pid !== process.pid;
      const isNotBlocked = process.state !== "blocked";

      if (hasArrived && isNotCompleted && isNotRunning && isNotBlocked) {
        const readyProcess = { ...process, state: "ready" as const };

        if (isRoundRobin && readyProcess.quantumRemaining === undefined) {
          readyProcess.quantumRemaining = state.quantum;
        }

        if (!readyQueue.find((p) => p.pid === process.pid)) {
          readyQueue.push(readyProcess);
        }

        const index = processes.findIndex((p) => p.pid === process.pid);
        if (
          index !== -1 &&
          processes[index].state !== "completed" &&
          processes[index].state !== "blocked"
        ) {
          processes[index].state = "ready";
          if (isRoundRobin && processes[index].quantumRemaining === undefined) {
            processes[index].quantumRemaining = state.quantum;
          }
        }
      } else if (
        !hasArrived &&
        process.state !== "completed" &&
        process.state !== "blocked"
      ) {
        const index = processes.findIndex((p) => p.pid === process.pid);
        if (index !== -1) processes[index].state = "waiting";
      } else if (process.state === "blocked" && isNotRunning) {
        if (!blockedProcesses.find((p) => p.pid === process.pid)) {
          blockedProcesses.push({ ...process });
        }
      }
    });

    readyQueue = sortQueue(readyQueue, state.algorithm);

    if (
      readyQueue.length === 0 &&
      blockedProcesses.length > 0 &&
      !currentProcess
    ) {
      const unblockedProcesses: Process[] = [];

      blockedProcesses.forEach((blockedProc) => {
        const unblocked = { ...blockedProc, state: "ready" as const };
        unblockedProcesses.push(unblocked);

        const index = processes.findIndex((p) => p.pid === blockedProc.pid);
        if (index !== -1) {
          processes[index] = { ...unblocked };
        }
      });

      if (isRoundRobin) {
        readyQueue = unblockedProcesses.reverse();
      } else {
        readyQueue = [...readyQueue, ...unblockedProcesses];
        readyQueue = sortQueue(readyQueue, state.algorithm);
      }

      blockedProcesses = [];
    }

    if (!currentProcess && readyQueue.length > 0) {
      currentProcess = { ...readyQueue[0], state: "running" };
      currentProcess.startTime = currentProcess.startTime || newTick;

      if (isRoundRobin && currentProcess.quantumRemaining === undefined) {
        currentProcess.quantumRemaining = state.quantum;
      }

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
      blockedProcesses,
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
