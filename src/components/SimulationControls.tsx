import React from "react";
import { MdSkipNext, MdSkipPrevious, MdCheckCircle } from "react-icons/md";
import { useSchedulerStore } from "../store/schedulerStore";
import type { SchedulingAlgorithm } from "../store/schedulerStore";

export const SimulationControls: React.FC = () => {
  const {
    algorithm,
    currentTick,
    processes,
    currentProcess,
    readyQueue,
    setAlgorithm,
    nextStep,
    previousStep,
  } = useSchedulerStore();

  const algorithms: { value: SchedulingAlgorithm; label: string }[] = [
    { value: "FIFO", label: "FIFO" },
    { value: "LIFO", label: "LIFO" },
    { value: "SJF", label: "SJF" },
    { value: "LJF", label: "LJF" },
  ];

  const allProcessesCompleted =
    processes.length > 0 &&
    processes.every((p) => p.state === "completed") &&
    !currentProcess &&
    readyQueue.length === 0;

  const canGoNext = !allProcessesCompleted;
  const canGoPrevious = currentTick > 0;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900 mb-3">
        Simulación
      </h2>

      <div className="space-y-3">
        {/* Algorithm and Tick in one row */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Algoritmo:
            </label>
            <select
              value={algorithm}
              onChange={(e) =>
                setAlgorithm(e.target.value as SchedulingAlgorithm)
              }
              className="w-full px-2 py-1 text-sm border border-neutral-300 rounded bg-white text-neutral-900"
            >
              {algorithms.map((alg) => (
                <option key={alg.value} value={alg.value}>
                  {alg.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <div className="text-sm text-neutral-600">Tick</div>
            <div className="text-2xl font-bold text-neutral-800">
              {currentTick}
            </div>
          </div>
        </div>

        {/* Completion status */}
        {allProcessesCompleted && (
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-700 bg-neutral-100 px-3 py-2 rounded">
            <MdCheckCircle className="text-neutral-600" size={16} />
            Simulación Completada
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={previousStep}
            disabled={!canGoPrevious}
            className="flex items-center gap-1 px-3 py-2 bg-neutral-200 text-neutral-700 text-sm rounded hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MdSkipPrevious size={16} />
            Anterior
          </button>

          <button
            onClick={nextStep}
            disabled={!canGoNext}
            className="flex items-center gap-1 px-3 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <MdSkipNext size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
