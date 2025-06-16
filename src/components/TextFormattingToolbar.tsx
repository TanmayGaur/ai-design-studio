import React from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
} from "lucide-react";
import { useDesign } from "../context/DesignContext";

interface TextFormattingToolbarProps {
  elementId: string;
  styles: Record<string, any>;
}

const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
  elementId,
  styles,
}) => {
  const { updateElement, state } = useDesign();

  const defaultFontFamilies = [
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Times New Roman", value: "Times New Roman, serif" },
    { name: "Helvetica", value: "Helvetica, sans-serif" },
    { name: "Courier New", value: "Courier New, monospace" },
    { name: "Verdana", value: "Verdana, sans-serif" },
    { name: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
    { name: "Impact", value: "Impact, sans-serif" },
    { name: "Comic Sans MS", value: "Comic Sans MS, cursive" },
    { name: "Palatino", value: "Palatino, serif" },
  ];

  // Add custom fonts from state.customFonts
  const customFontFamilies = Array.isArray(state.customFonts)
    ? state.customFonts
        .filter((font) => font.loaded)
        .map((font) => ({
          name: font.name,
          value: font.family,
        }))
    : [];

  // Merge and deduplicate by value
  const fontFamilies = [
    ...defaultFontFamilies,
    ...customFontFamilies.filter(
      (custom) => !defaultFontFamilies.some((def) => def.value === custom.value)
    ),
  ];

  const fontSizes = [
    8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72,
  ];

  const handleStyleChange = (property: string, value: any) => {
    updateElement(elementId, {
      styles: { ...styles, [property]: value },
    });
  };

  const toggleStyle = (
    property: string,
    activeValue: string,
    inactiveValue: string = "normal"
  ) => {
    const currentValue = styles[property] || inactiveValue;
    const newValue = currentValue === activeValue ? inactiveValue : activeValue;
    handleStyleChange(property, newValue);
  };

  const getCurrentFontSize = () => {
    const fontSize = styles.fontSize || "16px";
    return parseInt(fontSize.replace("px", ""));
  };

  const getCurrentTextAlign = () => {
    return styles.textAlign || "left";
  };

  const isBold = styles.fontWeight === "bold" || styles.fontWeight === "700";
  const isItalic = styles.fontStyle === "italic";
  const isUnderline = styles.textDecoration?.includes("underline");

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Type className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Text Formatting
        </span>
      </div>

      <div className="space-y-3">
        {/* Font Family and Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Font Family
            </label>
            <select
              value={styles.fontFamily || "Arial, sans-serif"}
              onChange={(e) => handleStyleChange("fontFamily", e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {fontFamilies.map((font) => (
                <option
                  key={font.value}
                  value={font.value}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Font Size
            </label>
            <select
              value={getCurrentFontSize()}
              onChange={(e) =>
                handleStyleChange("fontSize", `${e.target.value}px`)
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {fontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}pt
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Style Buttons */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Text Style
          </label>
          <div className="flex space-x-1">
            <button
              onClick={() => toggleStyle("fontWeight", "bold", "normal")}
              className={`p-2 rounded border ${
                isBold
                  ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>

            <button
              onClick={() => toggleStyle("fontStyle", "italic", "normal")}
              className={`p-2 rounded border ${
                isItalic
                  ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const currentDecoration = styles.textDecoration || "none";
                const hasUnderline = currentDecoration.includes("underline");
                const newDecoration = hasUnderline
                  ? currentDecoration.replace("underline", "").trim() || "none"
                  : currentDecoration === "none"
                  ? "underline"
                  : `${currentDecoration} underline`;
                handleStyleChange("textDecoration", newDecoration);
              }}
              className={`p-2 rounded border ${
                isUnderline
                  ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Text Alignment
          </label>
          <div className="flex space-x-1">
            {[
              { align: "left", icon: AlignLeft, label: "Left" },
              { align: "center", icon: AlignCenter, label: "Center" },
              { align: "right", icon: AlignRight, label: "Right" },
              { align: "justify", icon: AlignJustify, label: "Justify" },
            ].map(({ align, icon: Icon, label }) => (
              <button
                key={align}
                onClick={() => handleStyleChange("textAlign", align)}
                className={`p-2 rounded border ${
                  getCurrentTextAlign() === align
                    ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Text Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={styles.color || "#000000"}
              onChange={(e) => handleStyleChange("color", e.target.value)}
              className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={styles.color || "#000000"}
              onChange={(e) => handleStyleChange("color", e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Line Height
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={parseFloat(styles.lineHeight || "1.4")}
            onChange={(e) => handleStyleChange("lineHeight", e.target.value)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1.0</span>
            <span>{parseFloat(styles.lineHeight || "1.4").toFixed(1)}</span>
            <span>3.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextFormattingToolbar;
