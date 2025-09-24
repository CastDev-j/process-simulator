import type React from "react";
import {
  MdMemory,
  MdCheckCircle,
  MdPlayArrow,
  MdPause,
  MdList,
  MdDone,
} from "react-icons/md";
import { useSchedulerStore } from "../store/schedulerStore";

export const SimulationDisplay: React.FC = () => {
  const {
    currentTick,
    currentProcess,
    readyQueue,
    completedProcesses,
    algorithm,
  } = useSchedulerStore();

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          Estado del Sistema
        </h2>
        <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
          {algorithm} | Tick {currentTick}
        </span>
      </div>

      {/* CPU y Cola en el mismo nivel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* CPU */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MdMemory className="text-neutral-600" size={16} />
            <h3 className="font-medium text-neutral-900 text-sm">CPU</h3>
          </div>

          <div className="bg-neutral-50 rounded p-3 h-[100px] flex items-center justify-center border border-neutral-200">
            {currentProcess ? (
              <div className="text-center">
                <div className="text-sm font-bold text-neutral-800">
                  P{currentProcess.pid}
                </div>
                <div className="text-xs text-neutral-600">
                  Restante: {currentProcess.remainingTime} /{" "}
                  {currentProcess.duration}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-xs">
                    <MdPlayArrow size={10} />
                    Ejecutando
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-neutral-100 rounded-full w-fit mx-auto">
                  <MdPause size={24} className="text-neutral-400" />
                </div>
                <div className="text-sm font-medium text-neutral-500 mb-1">
                  Inactivo
                </div>
                <div className="text-xs text-neutral-400">Sin procesos</div>
              </div>
            )}
          </div>
        </div>

        {/* Cola */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MdList className="text-neutral-600" size={16} />
            <h3 className="font-medium text-neutral-900 text-sm">
              Cola ({readyQueue.length})
            </h3>
          </div>

          <div className="bg-neutral-50 rounded p-3 h-[100px] border border-neutral-200">
            {readyQueue.length > 0 ? (
              <div className="space-y-1 h-full overflow-y-auto">
                {readyQueue.map((process) => (
                  <div
                    key={process.pid}
                    className="flex justify-between items-center bg-white rounded px-2 py-1 border border-neutral-200 text-xs"
                  >
                    <span className="font-medium">P{process.pid}</span>
                    <span className="text-neutral-600">
                      T:{process.remainingTime}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center h-full flex flex-col justify-center">
                <div className="bg-neutral-100 rounded-full w-fit mx-auto">
                  <MdList size={24} className="text-neutral-400" />
                </div>
                <div className="text-sm font-medium text-neutral-500 mb-1">
                  Cola vacía
                </div>
                <div className="text-xs text-neutral-400">
                  No hay procesos esperando
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completados en nivel inferior - TODOS sin recortar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MdCheckCircle className="text-neutral-600" size={16} />
          <h3 className="font-medium text-neutral-900 text-sm">
            Completados ({completedProcesses.length})
          </h3>
        </div>

        <div className="bg-neutral-50 rounded p-3 border border-neutral-200 sm:h-[100px] h-fit">
          {completedProcesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-full overflow-y-auto">
              {completedProcesses
                .sort(
                  (a, b) => (a.completionTime || 0) - (b.completionTime || 0)
                )
                .map((process, index) => (
                  <div
                    key={process.pid}
                    className="flex justify-between items-center bg-white rounded p-2 border border-neutral-200 text-xs h-fit"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-neutral-200 text-neutral-700 px-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="font-medium">P{process.pid}</span>
                    </div>
                    <span className="text-neutral-600">
                      TA:{process.turnaroundTime}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center h-full flex flex-col justify-center">
              <div className="bg-neutral-100  rounded-full w-fit mx-auto">
                <MdDone size={24} className="text-neutral-400" />
              </div>
              <div className="text-sm font-medium text-neutral-500 mb-1">
                Sin completar
              </div>
              <div className="text-xs text-neutral-400">
                Los procesos terminados aparecerán aquí
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
