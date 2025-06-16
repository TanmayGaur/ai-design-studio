import React, { useState } from "react";
import {
  Palette,
  Sun,
  Moon,
  Undo,
  Redo,
  Save,
  Download,
  Menu,
  Plus,
  Upload,
  Trash2,
  FileText,
  Edit,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useDesign } from "../context/DesignContext";
import { useWorkflow } from "../context/WorkflowContext";
import PDFExportButton from "./PDFExportButton";

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { undo, redo, canUndo, canRedo } = useDesign();
  const {
    currentWorkflow,
    savedWorkflows,
    hasUnsavedChanges,
    isAutoSaving,
    saveWorkflow,
    loadWorkflow,
    createNewWorkflow,
    deleteWorkflow,
    exportWorkflow,
    importWorkflow,
  } = useWorkflow();

  const [showWorkflowMenu, setShowWorkflowMenu] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState("");

  const handleSave = async () => {
    if (currentWorkflow) {
      await saveWorkflow();
    } else {
      setShowSaveDialog(true);
    }
  };

  const handleSaveWithName = async () => {
    if (workflowName.trim()) {
      await saveWorkflow(workflowName.trim());
      setShowSaveDialog(false);
      setWorkflowName("");
    }
  };

  const handleNewWorkflow = async () => {
    const success = await createNewWorkflow();
    if (success) {
      setShowWorkflowMenu(false);
    }
  };

  const handleLoadWorkflow = async (workflowId: string) => {
    try {
      await loadWorkflow(workflowId);
      setShowWorkflowMenu(false);
    } catch (error) {
      alert("Failed to load workflow");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importWorkflow(file)
        .then(() => {
          alert("Workflow imported successfully");
          setShowWorkflowMenu(false);
        })
        .catch((error) => {
          alert(error.message);
        });
    }
    event.target.value = "";
  };

  return (
    <>
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Design Studio
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="flex items-center space-x-2 text-sm">
          {currentWorkflow && (
            <span className="text-gray-600 dark:text-gray-400">
              {currentWorkflow.name}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="text-orange-600 dark:text-orange-400">•</span>
          )}
          {isAutoSaving && (
            <span className="text-green-600 dark:text-green-400 text-xs">
              Auto Saving...
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* PDF Export Button */}
          <PDFExportButton />

          {/* Workflow Menu */}
          <div className="relative">
            <button
              onClick={() => setShowWorkflowMenu(!showWorkflowMenu)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Workflow Menu"
            >
              <Menu className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>

            {showWorkflowMenu && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Workflow Management
                  </h3>

                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={handleNewWorkflow}
                      className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New</span>
                    </button>

                    <label className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer text-sm">
                      <Upload className="h-4 w-4" />
                      <span>Import</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {savedWorkflows.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No saved workflows
                    </div>
                  ) : (
                    savedWorkflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleLoadWorkflow(workflow.id)}
                            className="text-left w-full"
                          >
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {workflow.name}
                              </span>
                              {currentWorkflow?.id === workflow.id && (
                                <>
                                  <Edit
                                    className="w-4 h-4"
                                    onClick={() => setShowSaveDialog(true)}
                                  />
                                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">
                                    Current
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Updated:{" "}
                              {new Date(workflow.updatedAt).toLocaleString()}
                            </div>
                          </button>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => exportWorkflow(workflow.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Export"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this workflow?"
                                )
                              ) {
                                deleteWorkflow(workflow.id);
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Close button */}
                <button
                  onClick={() => setShowWorkflowMenu(false)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Save Workflow"
          >
            <Save className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Toggle Theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </header>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Save Workflow
            </h3>

            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter workflow name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveWithName();
                } else if (e.key === "Escape") {
                  setShowSaveDialog(false);
                  setWorkflowName("");
                }
              }}
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setWorkflowName("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWithName}
                disabled={!workflowName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
