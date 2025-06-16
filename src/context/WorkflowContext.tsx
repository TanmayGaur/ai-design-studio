import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { DesignState } from "./DesignContext";

export interface WorkflowData {
  id: string;
  name: string;
  designState: DesignState;
  createdAt: string;
  updatedAt: string;
  version: string;
}

interface WorkflowContextType {
  currentWorkflow: WorkflowData | null;
  savedWorkflows: WorkflowData[];
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  saveWorkflow: (name?: string) => Promise<void>;
  loadWorkflow: (workflowId: string) => Promise<void>;
  createNewWorkflow: () => Promise<boolean>;
  deleteWorkflow: (workflowId: string) => void;
  markAsChanged: () => void;
  exportWorkflow: (workflowId: string) => void;
  importWorkflow: (file: File) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined
);

const STORAGE_KEY = "design-workflows";
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const WorkflowProvider: React.FC<{
  children: React.ReactNode;
  designState: DesignState;
  onStateChange: (state: DesignState) => void;
}> = ({ children, designState, onStateChange }) => {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowData | null>(
    null
  );
  const [savedWorkflows, setSavedWorkflows] = useState<WorkflowData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load saved workflows from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const workflows = JSON.parse(saved);
        setSavedWorkflows(workflows);

        // Load the most recent workflow if available
        if (workflows.length > 0) {
          const mostRecent = workflows.reduce(
            (latest: WorkflowData, current: WorkflowData) =>
              new Date(current.updatedAt) > new Date(latest.updatedAt)
                ? current
                : latest
          );
          setCurrentWorkflow(mostRecent);
          onStateChange(mostRecent.designState);
        }
      } catch (error) {
        console.error("Failed to load saved workflows:", error);
      }
    }
  }, [onStateChange]);

  // Auto-save functionality
  useEffect(() => {
    if (!currentWorkflow || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await saveWorkflow();
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsAutoSaving(false);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, currentWorkflow]);

  const generateWorkflowId = (): string => {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const saveToStorage = useCallback((workflows: WorkflowData[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    setSavedWorkflows(workflows);
  }, []);

  const saveWorkflow = useCallback(
    async (name?: string): Promise<void> => {
      const workflowName =
        name ||
        currentWorkflow?.name ||
        `Workflow ${new Date().toLocaleDateString()}`;

      const workflowData: WorkflowData = {
        id: currentWorkflow?.id || generateWorkflowId(),
        name: workflowName,
        designState: { ...designState },
        createdAt: currentWorkflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      };

      const existingIndex = savedWorkflows.findIndex(
        (w) => w.id === workflowData.id
      );
      let updatedWorkflows: WorkflowData[];

      if (existingIndex >= 0) {
        updatedWorkflows = [...savedWorkflows];
        updatedWorkflows[existingIndex] = workflowData;
      } else {
        updatedWorkflows = [...savedWorkflows, workflowData];
      }

      saveToStorage(updatedWorkflows);
      setCurrentWorkflow(workflowData);
      setHasUnsavedChanges(false);
    },
    [currentWorkflow, designState, savedWorkflows, saveToStorage]
  );

  const loadWorkflow = useCallback(
    async (workflowId: string): Promise<void> => {
      const workflow = savedWorkflows.find((w) => w.id === workflowId);
      if (!workflow) {
        throw new Error("Workflow not found");
      }

      setCurrentWorkflow(workflow);
      onStateChange(workflow.designState);
      setHasUnsavedChanges(false);
    },
    [savedWorkflows, onStateChange]
  );

  const createNewWorkflow = useCallback(async (): Promise<boolean> => {
    if (hasUnsavedChanges) {
      const shouldProceed = window.confirm(
        "You have unsaved changes. Creating a new workflow will lose these changes. Do you want to continue?"
      );
      if (!shouldProceed) {
        return false;
      }
    }

    const customFonts = currentWorkflow?.designState.customFonts;
    const newWorkflowId = generateWorkflowId();
    const defaultState: DesignState = {
      pages: [
        {
          id: "page-1",
          settings: {
            width: 210,
            height: 297,
            unit: "mm",
            orientation: "portrait",
            margins: { top: 20, right: 20, bottom: 20, left: 20 },
            backgroundColor: "#ffffff",
          },
          elements: [],
        },
      ],
      customFonts: customFonts || [],
      currentPageId: "page-1",
      zoom: 100,
      showGrid: false,
      showRulers: true,
      viewMode: "desktop",
      selectedElementIds: [],
      clipboard: [],
    };

    const newWorkflow: WorkflowData = {
      id: newWorkflowId,
      name: `New Workflow ${new Date().toLocaleDateString()}`,
      designState: defaultState,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    setCurrentWorkflow(newWorkflow);
    onStateChange(defaultState);
    setHasUnsavedChanges(false);
    return true;
  }, [hasUnsavedChanges, onStateChange]);

  const deleteWorkflow = useCallback(
    (workflowId: string) => {
      const updatedWorkflows = savedWorkflows.filter(
        (w) => w.id !== workflowId
      );
      saveToStorage(updatedWorkflows);

      if (currentWorkflow?.id === workflowId) {
        loadWorkflow(updatedWorkflows[0].id);
        // setCurrentWorkflow(updatedWorkflows.length > 0 ? updatedWorkflows[0] : null);
        setHasUnsavedChanges(false);
      }
    },
    [savedWorkflows, currentWorkflow, saveToStorage]
  );

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const exportWorkflow = useCallback(
    (workflowId: string) => {
      const workflow = savedWorkflows.find((w) => w.id === workflowId);
      if (!workflow) return;

      const dataStr = JSON.stringify(workflow, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${workflow.name.replace(/[^a-z0-9]/gi, "_")}.json`;
      link.click();

      URL.revokeObjectURL(url);
    },
    [savedWorkflows]
  );

  const importWorkflow = useCallback(
    async (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workflowData = JSON.parse(
              e.target?.result as string
            ) as WorkflowData;

            // Validate workflow structure
            if (!workflowData.id || !workflowData.designState) {
              throw new Error("Invalid workflow file format");
            }

            // Generate new ID to avoid conflicts
            workflowData.id = generateWorkflowId();
            workflowData.updatedAt = new Date().toISOString();

            const updatedWorkflows = [...savedWorkflows, workflowData];
            saveToStorage(updatedWorkflows);
            resolve();
          } catch (error) {
            reject(new Error("Failed to import workflow: Invalid file format"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },
    [savedWorkflows, saveToStorage]
  );

  const value: WorkflowContextType = {
    currentWorkflow,
    savedWorkflows,
    hasUnsavedChanges,
    isAutoSaving,
    saveWorkflow,
    loadWorkflow,
    createNewWorkflow,
    deleteWorkflow,
    markAsChanged,
    exportWorkflow,
    importWorkflow,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within WorkflowProvider");
  }
  return context;
};
