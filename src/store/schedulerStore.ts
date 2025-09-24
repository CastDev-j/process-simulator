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
  algorithm: SchedulingAlgorithm;
}

interface SchedulerState {
  processes: Process[];
  currentTick: number;
  currentProcess: Process | null;
  readyQueue: Process[];
  completedProcesses: Process[];
  algorithm: SchedulingAlgorithm;
  history: StateSnapshot[];

  // Actions
  setAlgorithm: (algorithm: SchedulingAlgorithm) => void;
  addProcesses: (processes: Process[]) => void;
  generateRandomProcesses: (count: number) => void;
  loadProcessesFromText: (text: string) => void;
  nextStep: () => void;
  previousStep: () => void;
}

const sortQueue = (
  queue: Process[],
  algorithm: SchedulingAlgorithm
): Process[] => {
  const sorted = [...queue];
  switch (algorithm) {
    case "FIFO":
      // First In, First Out - orden de llegada a la cola (por tiempo de llegada, luego por PID)
      return sorted.sort((a, b) => {
        if (a.arrivalTime !== b.arrivalTime) {
          return a.arrivalTime - b.arrivalTime;
        }
        return a.pid - b.pid; // Desempate por PID
      });
    case "LIFO":
      // Last In, First Out - último en llegar primero (por tiempo de llegada desc, luego por PID desc)
      return sorted.sort((a, b) => {
        if (a.arrivalTime !== b.arrivalTime) {
          return b.arrivalTime - a.arrivalTime;
        }
        return b.pid - a.pid; // Desempate por PID descendente
      });
    case "SJF":
      // Shortest Job First - menor tiempo restante primero (luego por tiempo de llegada)
      return sorted.sort((a, b) => {
        if (a.remainingTime !== b.remainingTime) {
          return a.remainingTime - b.remainingTime;
        }
        if (a.arrivalTime !== b.arrivalTime) {
          return a.arrivalTime - b.arrivalTime;
        }
        return a.pid - b.pid; // Desempate final por PID
      });
    case "LJF":
      // Longest Job First - mayor tiempo restante primero (luego por tiempo de llegada)
      return sorted.sort((a, b) => {
        if (a.remainingTime !== b.remainingTime) {
          return b.remainingTime - a.remainingTime;
        }
        if (a.arrivalTime !== b.arrivalTime) {
          return a.arrivalTime - b.arrivalTime;
        }
        return a.pid - b.pid; // Desempate final por PID
      });
    default:
      return sorted;
  }
};

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
    // Reset simulation when algorithm changes
    const state = get();
    if (state.processes.length > 0) {
      const resetProcesses = state.processes.map((p) => ({
        ...p,
        remainingTime: p.duration,
        state: "waiting" as const,
        startTime: undefined,
        completionTime: undefined,
        waitingTime: undefined,
        turnaroundTime: undefined,
      }));
      set({
        algorithm,
        processes: resetProcesses,
        currentTick: 0,
        currentProcess: null,
        readyQueue: [],
        completedProcesses: [],
        history: [],
      });
    } else {
      set({ algorithm });
    }
  },

  addProcesses: (processes) => {
    const processesWithState = processes.map((p) => ({
      ...p,
      remainingTime: p.duration,
      state: "waiting" as const,
    }));

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
    const processes: Process[] = [];
    for (let i = 1; i <= count; i++) {
      processes.push({
        pid: i,
        arrivalTime: Math.floor(Math.random() * 8) + 1, // Entre 1 y 8
        duration: Math.floor(Math.random() * 6) + 2, // Entre 2 y 7
        remainingTime: 0,
        state: "waiting",
      });
    }
    get().addProcesses(processes);
  },

  loadProcessesFromText: (text) => {
    const lines = text
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const processes: Process[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const pid = parseInt(parts[0]) || index + 1;
        const arrivalTime = Math.max(1, parseInt(parts[1]) || 1); // Mínimo 1
        const duration = Math.max(1, parseInt(parts[2]) || 1); // Mínimo 1

        processes.push({
          pid,
          arrivalTime,
          duration,
          remainingTime: duration,
          state: "waiting",
        });
      }
    });

    if (processes.length > 0) {
      get().addProcesses(processes);
    }
  },

  nextStep: () => {
    const state = get();

    // Check if all processes are completed
    const allProcessesCompleted =
      state.processes.length > 0 &&
      state.processes.every((p) => p.state === "completed") &&
      !state.currentProcess &&
      state.readyQueue.length === 0;

    if (allProcessesCompleted) {
      return;
    }

    // Save current state to history
    const currentStateSnapshot: StateSnapshot = {
      processes: [...state.processes],
      currentTick: state.currentTick,
      currentProcess: state.currentProcess ? { ...state.currentProcess } : null,
      readyQueue: [...state.readyQueue],
      completedProcesses: [...state.completedProcesses],
      algorithm: state.algorithm,
    };

    const newHistory = [...state.history, currentStateSnapshot];
    const newTick = state.currentTick + 1;

    // Recalculate the entire state based on the new tick
    // This ensures consistency when going forward after going backward
    const newProcesses = [...state.processes];
    let newReadyQueue: Process[] = [];
    let newCurrentProcess = state.currentProcess
      ? { ...state.currentProcess }
      : null;
    const newCompletedProcesses = [...state.completedProcesses];

    // First, handle the currently running process
    if (newCurrentProcess) {
      newCurrentProcess.remainingTime--;

      // Update in processes array immediately
      const currentProcessIndex = newProcesses.findIndex(
        (p) => p.pid === newCurrentProcess!.pid
      );
      if (currentProcessIndex !== -1) {
        newProcesses[currentProcessIndex] = { ...newCurrentProcess };
      }

      if (newCurrentProcess.remainingTime <= 0) {
        // Process completed
        newCurrentProcess.completionTime = newTick;
        newCurrentProcess.turnaroundTime =
          newCurrentProcess.completionTime - newCurrentProcess.arrivalTime;
        newCurrentProcess.waitingTime =
          newCurrentProcess.turnaroundTime - newCurrentProcess.duration;
        newCurrentProcess.state = "completed";

        // Add to completed if not already there
        if (
          !newCompletedProcesses.find((p) => p.pid === newCurrentProcess!.pid)
        ) {
          newCompletedProcesses.push({ ...newCurrentProcess });
        }

        // Update in processes array with completion data
        if (currentProcessIndex !== -1) {
          newProcesses[currentProcessIndex] = { ...newCurrentProcess };
        }

        newCurrentProcess = null;
      }
    }

    // Rebuild ready queue from scratch based on current state
    newReadyQueue = [];

    // Add all processes that should be in ready state at this tick
    newProcesses.forEach((process) => {
      // Process should be ready if:
      // 1. It has arrived (arrivalTime <= newTick)
      // 2. It's not completed
      // 3. It's not currently running
      const hasArrived = process.arrivalTime <= newTick;
      const isNotCompleted = process.state !== "completed";
      const isNotRunning =
        !newCurrentProcess || newCurrentProcess.pid !== process.pid;

      if (hasArrived && isNotCompleted && isNotRunning) {
        const readyProcess = { ...process };
        readyProcess.state = "ready";
        newReadyQueue.push(readyProcess);

        // Update state in main processes array
        const processIndex = newProcesses.findIndex(
          (p) => p.pid === process.pid
        );
        if (
          processIndex !== -1 &&
          newProcesses[processIndex].state !== "completed"
        ) {
          newProcesses[processIndex].state = "ready";
        }
      } else if (!hasArrived && process.state !== "completed") {
        // Process hasn't arrived yet, should be waiting
        const processIndex = newProcesses.findIndex(
          (p) => p.pid === process.pid
        );
        if (processIndex !== -1) {
          newProcesses[processIndex].state = "waiting";
        }
      }
    });

    // Sort the ready queue based on algorithm
    if (newReadyQueue.length > 0) {
      newReadyQueue = sortQueue(newReadyQueue, state.algorithm);
    }

    // Assign new process to CPU if available and ready queue has processes
    if (!newCurrentProcess && newReadyQueue.length > 0) {
      newCurrentProcess = { ...newReadyQueue[0] };
      newCurrentProcess.state = "running";

      if (!newCurrentProcess.startTime) {
        newCurrentProcess.startTime = newTick;
      }

      // Remove from ready queue
      newReadyQueue = newReadyQueue.filter(
        (p) => p.pid !== newCurrentProcess!.pid
      );

      // Update in processes array
      const processIndex = newProcesses.findIndex(
        (p) => p.pid === newCurrentProcess!.pid
      );
      if (processIndex !== -1) {
        newProcesses[processIndex] = { ...newCurrentProcess };
      }
    }

    set({
      currentTick: newTick,
      processes: newProcesses,
      readyQueue: newReadyQueue,
      currentProcess: newCurrentProcess,
      completedProcesses: newCompletedProcesses,
      history: newHistory,
    });
  },

  previousStep: () => {
    const state = get();
    if (state.history.length === 0) return;

    const previousState = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);

    set({
      processes: previousState.processes,
      currentTick: previousState.currentTick,
      currentProcess: previousState.currentProcess,
      readyQueue: previousState.readyQueue,
      completedProcesses: previousState.completedProcesses,
      algorithm: previousState.algorithm,
      history: newHistory,
    });
  },
}));
