import { DesignProvider } from "./context/DesignContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WorkflowProvider } from "./context/WorkflowContext";
import DesignInterface from "./components/DesignInterface";
import "./index.css";

function App() {
  return (
    <ThemeProvider>
      <DesignProvider>
        {({ state, onStateChange }) => (
          <WorkflowProvider designState={state} onStateChange={onStateChange}>
            <DesignInterface />
          </WorkflowProvider>
        )}
      </DesignProvider>
    </ThemeProvider>
  );
}

export default App;
