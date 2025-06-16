import React from "react";
import PropertiesPanel from "./panels/PropertiesPanel";
import PagesPanel from "./panels/PagesPanel";

const RightPanel: React.FC = () => {
  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-auto">
      {/* Pages Panel */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <PagesPanel />
      </div>

      {/* Properties Panel */}
      <div className="flex-1 overflow-y-auto">
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default RightPanel;
