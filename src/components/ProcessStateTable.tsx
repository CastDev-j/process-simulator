import type React from "react";
import {
  MdAccessTime,
  MdPlayArrow,
  MdCheckCircle,
  MdHelp,
  MdTableChart,
} from "react-icons/md";
import { useSchedulerStore } from "../store/schedulerStore";

export const ProcessStateTable: React.FC = () => {
  const { processes, currentTick } = useSchedulerStore();

  const getStateIcon = (state: string) => {
    switch (state) {
      case "waiting":
        return <MdAccessTime size={16} />;
      case "ready":
        return <MdAccessTime size={16} />;
      case "running":
        return <MdPlayArrow size={16} />;
      case "completed":
        return <MdCheckCircle size={16} />;
      default:
        return <MdHelp size={16} />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "ready":
        return "bg-blue-100 text-blue-800";
      case "running":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-neutral-100 text-neutral-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case "waiting":
        return "Esperando";
      case "ready":
        return "Listo";
      case "running":
        return "Ejecutando";
      case "completed":
        return "Completado";
      default:
        return "Desconocido";
    }
  };

  if (processes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MdTableChart className="h-4 w-4 text-neutral-600" />
          <h2 className="text-lg font-semibold text-neutral-900">
            Estado de Procesos
          </h2>
        </div>
        <div className="text-center py-4 text-neutral-500">
          <div className="text-sm">No hay procesos para mostrar</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MdTableChart className="h-4 w-4 text-neutral-600" />
        <h2 className="text-lg font-semibold text-neutral-900">
          Estado de Procesos (Tick {currentTick})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left p-2 font-medium text-neutral-900">
                PID
              </th>
              <th className="text-left p-2 font-medium text-neutral-900">
                Estado
              </th>
              <th className="text-left p-2 font-medium text-neutral-900">
                Llegada
              </th>
              <th className="text-left p-2 font-medium text-neutral-900">
                Duración
              </th>
              <th className="text-left p-2 font-medium text-neutral-900">
                Restante
              </th>
              <th className="text-left p-2 font-medium text-neutral-900">
                Progreso
              </th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => {
              const executed = process.duration - process.remainingTime;
              const progress =
                process.duration > 0 ? (executed / process.duration) * 100 : 0;
              const progressClamped = Math.max(0, Math.min(100, progress));

              return (
                <tr
                  key={process.pid}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="p-2 font-medium">P{process.pid}</td>
                  <td className="p-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStateColor(
                        process.state
                      )}`}
                    >
                      {getStateIcon(process.state)}
                      {getStateText(process.state)}
                    </span>
                  </td>
                  <td className="p-2">{process.arrivalTime}</td>
                  <td className="p-2">{process.duration}</td>
                  <td className="p-2">{process.remainingTime}</td>
                  <td className="p-2">
                    <div className="w-full bg-neutral-200 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          process.state === "completed"
                            ? "bg-green-500"
                            : process.state === "running"
                            ? "bg-blue-500"
                            : "bg-neutral-400"
                        }`}
                        style={{ width: `${progressClamped}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-600">
                      <span>
                        {executed}/{process.duration}
                      </span>
                      <span>{Math.round(progressClamped)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
