import React from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { useDesign } from "../../context/DesignContext";

const PagesPanel: React.FC = () => {
  const { state, addPage, deletePage, setCurrentPage } = useDesign();

  return (
    <div className="p-4 overflow-y-auto max-h-[50vh]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Pages
        </h3>
        <button
          onClick={addPage}
          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Add Page"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {state.pages.map((page, index) => (
          <div
            key={page.id}
            className={`relative group border rounded-lg p-3 cursor-pointer transition-colors ${
              page.id === state.currentPageId
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            onClick={() => setCurrentPage(page.id)}
          >
            {/* Page Thumbnail */}
            <div className="aspect-[3/4] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded mb-2 flex items-center justify-center">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>

            {/* Page Info */}
            <div className="text-center">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Page {index + 1}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {page.settings.width} × {page.settings.height}{" "}
                {page.settings.unit}
              </p>
            </div>

            {/* Actions */}
            {state.pages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePage(page.id);
                }}
                className="absolute top-1 right-1 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Page"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PagesPanel;
