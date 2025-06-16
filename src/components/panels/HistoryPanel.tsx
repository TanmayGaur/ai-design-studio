import React from "react";
import { Clock, RotateCcw, RotateCw } from "lucide-react";
import { useDesign } from "../../context/DesignContext";

const HistoryPanel: React.FC = () => {
  const { history, undo, redo, canUndo, canRedo } = useDesign();

  return (
    <div className="space-y-4">
      {/* Undo/Redo Controls */}
      <div className="flex space-x-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Undo</span>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
        >
          <RotateCw className="h-4 w-4" />
          <span>Redo</span>
        </button>
      </div>

      {/* History List */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recent Actions
          </h3>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {history.past.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-500 italic">
              No actions yet
            </p>
          ) : (
            history.past
              .slice(-10)
              .reverse()
              .map((_, index) => (
                <div
                  key={index}
                  className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400"
                >
                  Action {history.past.length - index}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
