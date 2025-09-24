"use client";

import type React from "react";
import { useState } from "react";
import { MdShuffle, MdFileUpload } from "react-icons/md";
import { useSchedulerStore } from "../store/schedulerStore";

export const ProcessInput: React.FC = () => {
  const [processCount, setProcessCount] = useState(5);
  const [showManual, setShowManual] = useState(false);
  const [textInput, setTextInput] = useState("");

  const { generateRandomProcesses, loadProcessesFromText } =
    useSchedulerStore();

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

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900 mb-3">
        Entrada de Procesos
      </h2>

      <div className="space-y-3">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Random Generation */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-neutral-700">Aleatorio:</label>
            <input
              type="number"
              value={processCount}
              onChange={(e) =>
                setProcessCount(
                  Math.max(1, Number.parseInt(e.target.value) || 1)
                )
              }
              className="w-16 px-2 py-1 text-xs border border-neutral-300 rounded bg-white text-neutral-900"
              min="1"
              max="10"
            />
            <button
              onClick={() => generateRandomProcesses(processCount)}
              className="flex items-center gap-1 px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-900 transition-colors"
            >
              <MdShuffle size={14} />
              Generar
            </button>
          </div>

          {/* File Upload */}
          <label className="flex items-center gap-1 px-3 py-1 bg-neutral-200 text-neutral-700 text-xs rounded hover:bg-neutral-300 transition-colors cursor-pointer">
            <MdFileUpload size={14} />
            Archivo
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Manual Toggle */}
          <button
            onClick={() => setShowManual(!showManual)}
            className="px-3 py-1 bg-neutral-600 text-white text-xs rounded hover:bg-neutral-700 transition-colors"
          >
            Manual
          </button>
        </div>

        {/* Manual Input Area */}
        {showManual && (
          <div className="space-y-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="1 1 5&#10;2 2 3&#10;3 4 8"
              className="w-full h-20 px-2 py-1 text-xs border border-neutral-300 rounded bg-white text-neutral-900 resize-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
                className="px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-900 transition-colors disabled:opacity-50"
              >
                Cargar
              </button>
              <button
                onClick={() => setShowManual(false)}
                className="px-3 py-1 bg-neutral-200 text-neutral-700 text-xs rounded hover:bg-neutral-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
