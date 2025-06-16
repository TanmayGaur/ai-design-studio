import React from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useDesign } from "../../context/DesignContext";

const PageLayoutPanel: React.FC = () => {
  const { state, updatePageSettings } = useDesign();
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const currentPage = state.pages.find((p) => p.id === state.currentPageId);
  if (!currentPage) return null;

  const { settings } = currentPage;

  const presetSizes = [
    { name: "A4", width: 210, height: 297, unit: "mm" as const },
    { name: "A3", width: 297, height: 420, unit: "mm" as const },
  ];

  const handlePresetSize = (preset: (typeof presetSizes)[0]) => {
    updatePageSettings(state.currentPageId, {
      width: preset.width,
      height: preset.height,
      unit: preset.unit,
    });
  };

  const toggleOrientation = () => {
    updatePageSettings(state.currentPageId, {
      width: settings.height,
      height: settings.width,
      orientation:
        settings.orientation === "portrait" ? "landscape" : "portrait",
    });
  };

  return (
    <div className="space-y-4">
      {/* Preset Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preset Sizes
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presetSizes.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSize(preset)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Width
          </label>
          <input
            type="number"
            value={settings.width}
            onChange={(e) =>
              updatePageSettings(state.currentPageId, {
                width: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Height
          </label>
          <input
            type="number"
            value={settings.height}
            onChange={(e) =>
              updatePageSettings(state.currentPageId, {
                height: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Unit Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Unit
        </label>
        <select
          value={settings.unit}
          onChange={(e) =>
            updatePageSettings(state.currentPageId, {
              unit: e.target.value as "px" | "mm" | "in",
            })
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="mm">Millimeters (mm)</option>
        </select>
      </div>

      {/* Orientation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Orientation
        </label>
        <button
          onClick={toggleOrientation}
          className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          {settings.orientation === "portrait" ? (
            <RotateCw className="h-4 w-4" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          <span className="capitalize">{settings.orientation}</span>
        </button>
      </div>

      {/* Margins */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Margins
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
              Top
            </label>
            <input
              type="number"
              placeholder="Top"
              value={settings.margins.top}
              onChange={(e) =>
                updatePageSettings(state.currentPageId, {
                  margins: { ...settings.margins, top: Number(e.target.value) },
                })
              }
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
              Right
            </label>
            <input
              type="number"
              placeholder="Right"
              value={settings.margins.right}
              onChange={(e) =>
                updatePageSettings(state.currentPageId, {
                  margins: {
                    ...settings.margins,
                    right: Number(e.target.value),
                  },
                })
              }
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
              Bottom
            </label>
            <input
              type="number"
              placeholder="Bottom"
              value={settings.margins.bottom}
              onChange={(e) =>
                updatePageSettings(state.currentPageId, {
                  margins: {
                    ...settings.margins,
                    bottom: Number(e.target.value),
                  },
                })
              }
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
              Left
            </label>
            <input
              type="number"
              placeholder="Left"
              value={settings.margins.left}
              onChange={(e) =>
                updatePageSettings(state.currentPageId, {
                  margins: {
                    ...settings.margins,
                    left: Number(e.target.value),
                  },
                })
              }
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
            />
          </div>
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Background Color
        </label>
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-between px-3"
            style={{ backgroundColor: settings.backgroundColor }}
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {settings.backgroundColor}
            </span>
          </button>
          {showColorPicker && (
            <div className="absolute z-10 mt-2">
              <HexColorPicker
                color={settings.backgroundColor}
                onChange={(color) =>
                  updatePageSettings(state.currentPageId, {
                    backgroundColor: color,
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLayoutPanel;
