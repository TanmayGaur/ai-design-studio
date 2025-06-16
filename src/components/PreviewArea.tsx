import React, { useRef, useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Ruler,
  Move,
  Navigation,
} from "lucide-react";
import { useDesign } from "../context/DesignContext";
import Canvas from "./Canvas";

const PreviewArea: React.FC = () => {
  const { state, setZoom, toggleGrid, toggleRulers } = useDesign();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showBoundaryWarning, setShowBoundaryWarning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  // Calculate canvas dimensions for boundary checking
  const currentPage = state.pages.find((p) => p.id === state.currentPageId);
  const canvasDimensions = currentPage
    ? {
        width:
          ((currentPage.settings.width * 96) / 25.4) *
          ((state.zoom ?? 100) / 100), // Convert mm to px and apply zoom
        height:
          ((currentPage.settings.height * 96) / 25.4) *
          ((state.zoom ?? 100) / 100),
      }
    : { width: 0, height: 0 };

  // Calculate maximum pan limits (120% of canvas size)
  const maxPanX = canvasDimensions.width * 0.6; // 120% / 2 = 60% on each side
  const maxPanY = canvasDimensions.height * 0.6;

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(state.zoom ?? 100);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(state.zoom ?? 100);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  const resetZoom = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

  const checkBoundaries = (newOffset: { x: number; y: number }) => {
    const clampedX = Math.max(-maxPanX, Math.min(maxPanX, newOffset.x));
    const clampedY = Math.max(-maxPanY, Math.min(maxPanY, newOffset.y));

    const hitBoundary = clampedX !== newOffset.x || clampedY !== newOffset.y;

    if (hitBoundary) {
      setShowBoundaryWarning(true);
      setTimeout(() => setShowBoundaryWarning(false), 1000);
    }

    return { x: clampedX, y: clampedY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan with middle mouse button or space+click
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const newOffset = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      };

      const clampedOffset = checkBoundaries(newOffset);
      setPanOffset(clampedOffset);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const panStep = 20;
      let newOffset = { ...panOffset };

      switch (e.key) {
        case "ArrowUp":
          newOffset.y += panStep;
          break;
        case "ArrowDown":
          newOffset.y -= panStep;
          break;
        case "ArrowLeft":
          newOffset.x += panStep;
          break;
        case "ArrowRight":
          newOffset.x -= panStep;
          break;
        case "Home":
          newOffset = { x: 0, y: 0 };
          break;
        default:
          return;
      }

      e.preventDefault();
      const clampedOffset = checkBoundaries(newOffset);
      setPanOffset(clampedOffset);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panOffset, maxPanX, maxPanY]);

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1"></div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={(state.zoom ?? 100) <= zoomLevels[0]}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={resetZoom}
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-[60px]"
            title="Reset Zoom & Pan"
          >
            {state.zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={(state.zoom ?? 100) >= zoomLevels[zoomLevels.length - 1]}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* View Options */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleGrid}
            className={`p-2 rounded-md transition-colors ${
              state.showGrid
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>

          <button
            onClick={toggleRulers}
            className={`p-2 rounded-md transition-colors ${
              state.showRulers
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
            title="Toggle Rulers"
          >
            <Ruler className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative ${
          isPanning ? "cursor-grabbing" : "cursor-default"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isPanning ? "none" : "transform 0.2s ease-out",
          }}
        >
          <Canvas />
        </div>

        {/* Pan indicator */}
        {isPanning && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
            <Move className="h-3 w-3" />
            <span>Panning (Shift+Drag)</span>
          </div>
        )}

        {/* Boundary warning */}
        {showBoundaryWarning && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded text-sm flex items-center space-x-2 animate-bounce">
            <Navigation className="h-4 w-4" />
            <span>Pan limit reached</span>
          </div>
        )}

        {/* Mini-map */}
        {/* <div className="absolute bottom-4 right-4 w-32 h-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg">
          <div className="w-full h-full relative overflow-hidden">
            <div 
              className="absolute bg-indigo-200 dark:bg-indigo-800 border border-indigo-400 dark:border-indigo-600"
              style={{
                width: '20%',
                height: '30%',
                left: `${50 + (panOffset.x / maxPanX) * 40}%`,
                top: `${50 + (panOffset.y / maxPanY) * 35}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-sm" />
            </div>
          </div>
          <div className="absolute -top-6 left-0 text-xs text-gray-500 dark:text-gray-400">
            Mini-map
          </div>
        </div> */}

        {/* Instructions */}
        {/* <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
          <div className="space-y-1">
            <div>• Drag elements to move</div>
            <div>• Double-click text to edit</div>
            <div>• Drag corners to resize</div>
            <div>• Shift+Drag to pan canvas</div>
            <div>• Arrow keys to navigate</div>
            <div>• Home key to center</div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default PreviewArea;
