import React, { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useHotkeys } from "react-hotkeys-hook";
import { useDesign } from "../context/DesignContext";
import { useTheme } from "../context/ThemeContext";
import { useWorkflow } from "../context/WorkflowContext";
import Header from "./Header";
import LeftSidebar from "./LeftSidebar";
import PreviewArea from "./PreviewArea";
import RightPanel from "./RightPanel";

const DesignInterface: React.FC = () => {
  const { undo, redo, canUndo, canRedo, state, duplicateElement } = useDesign();
  const { isDark } = useTheme();
  const { markAsChanged, saveWorkflow } = useWorkflow();

  // Keyboard shortcuts
  useHotkeys("ctrl+z, cmd+z", () => canUndo && undo(), [canUndo, undo]);
  useHotkeys(
    "ctrl+y, cmd+y, ctrl+shift+z, cmd+shift+z",
    () => canRedo && redo(),
    [canRedo, redo]
  );
  useHotkeys("ctrl+s, cmd+s", (e) => {
    e.preventDefault();
    // Save functionality is handled by the workflow context
    saveWorkflow();
  });
  useHotkeys("ctrl+d, cmd+d", (e) => {
    e.preventDefault();
    // Mark as changed when duplicating elements
    if (state.selectedElementIds && state.selectedElementIds.length > 0) {
      duplicateElement(state.selectedElementIds[0]);
      markAsChanged();
    }
  });

  // Mark as changed when design state changes
  useEffect(() => {
    markAsChanged();
  }, [markAsChanged]);

  return (
    <div className={`h-screen flex flex-col ${isDark ? "dark" : ""}`}>
      <Header />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <LeftSidebar />
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />

          {/* Main Preview Area */}
          <Panel defaultSize={60} minSize={40}>
            <PreviewArea />
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />

          {/* Right Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <RightPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default DesignInterface;
