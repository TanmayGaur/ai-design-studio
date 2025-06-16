import React from "react";
import { Type, Square, Circle, Image, Minus } from "lucide-react";
import { useDesign } from "../../context/DesignContext";

const ElementsPanel: React.FC = () => {
  const { addElement } = useDesign();

  const elements = [
    {
      type: "text" as const,
      icon: Type,
      label: "Text",
      defaultProps: {
        type: "text" as const,
        x: 50, // Will be converted to mm in context
        y: 50, // Will be converted to mm in context
        width: 220, // Will be converted to mm in context
        height: 65, // Will be converted to mm in context
        rotation: 0,
        content: "Sample Text",
        styles: {
          fontSize: "16px",
          fontFamily: "Arial, sans-serif",
          color: "#000000",
          textAlign: "left",
          display: "flex",
          alignItems: "self-start",
          backgroundColor: "transparent",
        },
      },
    },
    {
      type: "shape",
      icon: Square,
      label: "Rectangle",
      defaultProps: {
        type: "shape" as const,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0,
        styles: {
          backgroundColor: "#3b82f6",
          borderRadius: "4px",
        },
      },
    },
    {
      type: "shape",
      icon: Circle,
      label: "Circle",
      defaultProps: {
        type: "shape" as const,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0,
        styles: {
          backgroundColor: "#ef4444",
          borderRadius: "50%",
        },
      },
    },
    {
      type: "line",
      icon: Minus,
      label: "Line",
      defaultProps: {
        type: "line" as const,
        x: 50,
        y: 50,
        width: 200,
        height: 2,
        rotation: 0,
        styles: {
          backgroundColor: "#000000",
        },
      },
    },
    {
      type: "image",
      icon: Image,
      label: "Image",
      defaultProps: {
        type: "image" as const,
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        rotation: 0,
        styles: {
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          objectFit: "cover",
        },
      },
    },
  ];

  const handleAddElement = (elementProps: any) => {
    addElement(elementProps);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Click to add elements to your design
      </p>

      <div className="grid grid-cols-2 gap-2">
        {elements.map((element) => {
          const Icon = element.icon;
          return (
            <button
              key={element.label}
              onClick={() => handleAddElement(element.defaultProps)}
              className="flex flex-col items-center justify-center p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 mb-1" />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {element.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 Tip: Elements can be rotated, resized, and moved directly on the
          canvas. Use the Properties panel for precise control.
        </p>
      </div>
    </div>
  );
};

export default ElementsPanel;
