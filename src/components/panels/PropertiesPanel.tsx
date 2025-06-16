import React, { useState } from "react";
import { Settings, Trash2, RotateCw, Type } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useDesign } from "../../context/DesignContext";
import TextFormattingToolbar from "../TextFormattingToolbar";

const PropertiesPanel: React.FC = () => {
  const { state, updateElement, deleteElement, selectElement } = useDesign();
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showTextFormatting, setShowTextFormatting] = useState(false);

  const currentPage = state.pages.find((p) => p.id === state.currentPageId);
  const selectedElement = currentPage?.elements.find(
    (el) => el.id === (state.selectedElementIds ?? [])[0]
  );

  // Conversion functions
  const mmToIn = (mm: number): number => Math.round((mm / 25.4) * 100) / 100;
  const inToMm = (inches: number): number =>
    Math.round(inches * 25.4 * 100) / 100;

  if (
    !selectedElement ||
    !state.selectedElementIds ||
    state.selectedElementIds.length > 1
  ) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Properties
          </h3>
        </div>

        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property: string, value: any) => {
    if (property.startsWith("styles.")) {
      const styleProp = property.replace("styles.", "");
      updateElement(selectedElement.id, {
        styles: { ...selectedElement.styles, [styleProp]: value },
      });
    } else {
      updateElement(selectedElement.id, { [property]: value });
    }
  };

  const handleDimensionChange = (
    property: string,
    value: number,
    unit: "mm" | "in"
  ) => {
    // Convert to mm for internal storage
    const mmValue = unit === "in" ? inToMm(value) : value;
    handlePropertyChange(property, mmValue);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Properties
          </h3>
        </div>

        <div className="flex items-center space-x-1">
          {selectedElement.type === "text" && (
            <button
              onClick={() => setShowTextFormatting(!showTextFormatting)}
              className={`p-1 rounded ${
                showTextFormatting
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title="Text Formatting"
            >
              <Type className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => {
              deleteElement(selectedElement.id);
              selectElement(undefined);
            }}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete Element"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Text Formatting Toolbar */}
      {selectedElement.type === "text" && showTextFormatting && (
        <div className="mb-4">
          <TextFormattingToolbar
            elementId={selectedElement.id}
            styles={selectedElement.styles}
          />
        </div>
      )}

      {/* Position & Size */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Position & Size
        </h4>

        <div className="space-y-3">
          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                X (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={Math.round(selectedElement.x * 100) / 100}
                onChange={(e) =>
                  handleDimensionChange("x", Number(e.target.value), "mm")
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">
                {mmToIn(selectedElement.x)}"
              </span>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Y (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={Math.round(selectedElement.y * 100) / 100}
                onChange={(e) =>
                  handleDimensionChange("y", Number(e.target.value), "mm")
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">
                {mmToIn(selectedElement.y)}"
              </span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Width (mm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={Math.round(selectedElement.width * 100) / 100}
                onChange={(e) =>
                  handleDimensionChange("width", Number(e.target.value), "mm")
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">
                {mmToIn(selectedElement.width)}"
              </span>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Height (mm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={Math.round(selectedElement.height * 100) / 100}
                onChange={(e) =>
                  handleDimensionChange("height", Number(e.target.value), "mm")
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">
                {mmToIn(selectedElement.height)}"
              </span>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              <RotateCw className="inline h-3 w-3 mr-1" />
              Rotation (degrees)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="360"
                value={Math.round((selectedElement.rotation || 0) * 100) / 100}
                onChange={(e) => {
                  let value = Number(e.target.value);
                  // Normalize to 0-360 range
                  value = ((value % 360) + 360) % 360;
                  handlePropertyChange("rotation", value);
                }}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedElement.rotation || 0}
                onChange={(e) =>
                  handlePropertyChange("rotation", Number(e.target.value))
                }
                className="flex-1"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <button
                onClick={() => handlePropertyChange("rotation", 0)}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                0°
              </button>
              <button
                onClick={() => handlePropertyChange("rotation", 90)}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                90°
              </button>
              <button
                onClick={() => handlePropertyChange("rotation", 180)}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                180°
              </button>
              <button
                onClick={() => handlePropertyChange("rotation", 270)}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                270°
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Text Content (for text elements) */}
      {selectedElement.type === "text" && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </h4>
          <textarea
            value={selectedElement.content || ""}
            onChange={(e) => handlePropertyChange("content", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
        </div>
      )}

      {/* Image Properties (for image elements) */}
      {selectedElement.type === "image" && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image Properties
          </h4>

          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Object Fit
              </label>
              <select
                value={selectedElement.styles.objectFit || "cover"}
                onChange={(e) =>
                  handlePropertyChange("styles.objectFit", e.target.value)
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="scale-down">Scale Down</option>
                <option value="none">None</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Upload New Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const imageUrl = event.target?.result as string;
                      handlePropertyChange("content", file.name);
                      handlePropertyChange("styles.backgroundImage", imageUrl);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Styling */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Styling
        </h4>

        {/* Background Color */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Background Color
          </label>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-between px-2"
              style={{
                backgroundColor:
                  selectedElement.styles.backgroundColor || "#ffffff",
              }}
            >
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {selectedElement.styles.backgroundColor || "#ffffff"}
              </span>
            </button>
            {showColorPicker && (
              <div className="absolute z-10 mt-1">
                <HexColorPicker
                  color={selectedElement.styles.backgroundColor || "#ffffff"}
                  onChange={(color) =>
                    handlePropertyChange("styles.backgroundColor", color)
                  }
                />
              </div>
            )}
          </div>
        </div>
        {/* Border Styles */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Border
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400">
                Width (px)
              </label>
              <input
                type="number"
                min="0"
                value={parseInt(selectedElement.styles.borderWidth || "0")}
                onChange={(e) =>
                  handlePropertyChange(
                    "styles.borderWidth",
                    `${e.target.value}px`
                  )
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400">
                Style
              </label>
              <select
                value={selectedElement.styles.borderStyle || "solid"}
                onChange={(e) =>
                  handlePropertyChange("styles.borderStyle", e.target.value)
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400">
                Color
              </label>
              <input
                type="color"
                value={selectedElement.styles.borderColor || "#000000"}
                onChange={(e) =>
                  handlePropertyChange("styles.borderColor", e.target.value)
                }
                className="w-full h-7 px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Border Radius */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Border Radius (px)
          </label>
          <input
            type="number"
            min="0"
            value={parseInt(selectedElement.styles.borderRadius || "0")}
            onChange={(e) =>
              handlePropertyChange("styles.borderRadius", `${e.target.value}px`)
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Opacity
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedElement.styles.opacity || 1}
              onChange={(e) =>
                handlePropertyChange("styles.opacity", Number(e.target.value))
              }
              className="flex-1"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
              {Math.round((selectedElement.styles.opacity || 1) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Preview Note */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          📏 Measurements are stored in millimeters (mm) for precision. Pixel
          values are used only for screen preview.
        </p>
      </div>
    </div>
  );
};

export default PropertiesPanel;
