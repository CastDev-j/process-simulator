import { ProcessInputAndControls } from "./components/ProcessInputAndControls";
import { SimulationDisplay } from "./components/SimulationDisplay";
import { ProcessStateTable } from "./components/ProcessStateTable";

function App() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-4">
        <header className="text-center mb-4">
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">
            Simulador
          </h1>
          <p className="text-sm text-neutral-600">FIFO, LIFO, SJF, LJF</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ProcessInputAndControls />
          <SimulationDisplay />
        </div>

        <div className="grid grid-cols-1">
          <ProcessStateTable />
        </div>
      </div>
    </div>
  );
}

export default App;
