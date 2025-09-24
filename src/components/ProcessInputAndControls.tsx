import React, { useState } from "react";
import {
  MdShuffle,
  MdFileUpload,
  MdSkipNext,
  MdSkipPrevious,
  MdCheckCircle,
} from "react-icons/md";
import { useSchedulerStore } from "../store/schedulerStore";
import type { SchedulingAlgorithm } from "../store/schedulerStore";

export const ProcessInputAndControls: React.FC = () => {
  const [processCount, setProcessCount] = useState(5);
  const [showManual, setShowManual] = useState(false);
  const [textInput, setTextInput] = useState("");

  const {
    generateRandomProcesses,
    loadProcessesFromText,
    algorithm,
    currentTick,
    processes,
    currentProcess,
    readyQueue,
    setAlgorithm,
    nextStep,
    previousStep,
  } = useSchedulerStore();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        loadProcessesFromText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      loadProcessesFromText(textInput);
      setTextInput("");
      setShowManual(false);
    }
  };

  const algorithms: { value: SchedulingAlgorithm; label: string }[] = [
    { value: "FIFO", label: "FIFO (First In, First Out)" },
    { value: "LIFO", label: "LIFO (Last In, First Out)" },
    { value: "SJF", label: "SJF (Shortest Job First)" },
    { value: "LJF", label: "LJF (Longest Job First)" },
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
        Entrada de Procesos y Simulación
      </h2>

      <div className="space-y-4">
        {/* Process Input Section */}
        <div className="border-b border-neutral-200 pb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">
            Entrada de Procesos
          </h3>

          <div className="space-y-3">
            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Random Generation */}
              <div className="flex items-center gap-2">
                <label className="font-medium text-neutral-700">
                  Aleatorio:
                </label>
                <input
                  type="number"
                  value={processCount}
                  onChange={(e) => setProcessCount(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-16 px-2 py-1 border border-neutral-300 rounded text-center text-xs"
                />
                <button
                  onClick={() => generateRandomProcesses(processCount)}
                  className="flex items-center gap-1 px-3 py-1 bg-neutral-600 text-white rounded hover:bg-neutral-700 text-xs"
                >
                  <MdShuffle size={14} />
                  Generar
                </button>
              </div>

              {/* File Upload */}
              <div className="flex items-center gap-2">
                <label className="font-medium text-neutral-700">Archivo:</label>
                <label className="flex items-center gap-1 px-3 py-1 bg-neutral-100 border border-neutral-300 rounded cursor-pointer hover:bg-neutral-200 text-xs">
                  <MdFileUpload size={14} />
                  Cargar
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Manual Input Toggle */}
              <button
                onClick={() => setShowManual(!showManual)}
                className="px-3 py-1 bg-neutral-100 border border-neutral-300 rounded hover:bg-neutral-200 text-xs"
              >
                {showManual ? "Ocultar" : "Entrada Manual"}
              </button>
            </div>

            {/* Manual Input Area */}
            {showManual && (
              <div className="space-y-2">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Formato: 'pid' 'llegada' 'duración' (separado por espacios)"
                  className="w-full h-24 p-2 border border-neutral-300 rounded text-xs font-mono resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setTextInput("");
                      setShowManual(false);
                    }}
                    className="px-3 py-1 text-neutral-600 hover:bg-neutral-100 rounded text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleTextSubmit}
                    className="px-3 py-1 bg-neutral-600 text-white rounded hover:bg-neutral-700 text-xs"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simulation Controls Section */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">
            Control de Simulación
          </h3>

          <div className="space-y-3">
            {/* Algorithm and Tick in one row */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Algoritmo:
                </label>
                <select
                  value={algorithm}
                  onChange={(e) =>
                    setAlgorithm(e.target.value as SchedulingAlgorithm)
                  }
                  className="w-full p-2 border border-neutral-300 rounded text-xs"
                >
                  {algorithms.map((algorithm) => (
                    <option key={algorithm.value} value={algorithm.value}>
                      {algorithm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium text-neutral-700 mb-1">
                  Tick Actual
                </div>
                <div className="bg-neutral-100 border border-neutral-300 rounded px-3 py-2 font-mono text-sm font-bold text-neutral-800">
                  {currentTick}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={previousStep}
                disabled={!canGoPrevious}
                className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium ${
                  canGoPrevious
                    ? "bg-neutral-600 text-white hover:bg-neutral-700"
                    : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                }`}
              >
                <MdSkipPrevious size={16} />
                Anterior
              </button>

              <button
                onClick={nextStep}
                disabled={!canGoNext}
                className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium ${
                  canGoNext
                    ? "bg-neutral-600 text-white hover:bg-neutral-700"
                    : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                }`}
              >
                Siguiente
                <MdSkipNext size={16} />
              </button>

              {allProcessesCompleted && (
                <span className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded text-xs">
                  <MdCheckCircle size={16} />
                  Completado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
