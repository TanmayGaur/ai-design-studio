import React, { useState, useRef, useEffect } from "react";
import { useDesign } from "../context/DesignContext";

const Canvas: React.FC = () => {
  const { state, updateElement, selectElement } = useDesign();
  console.log("Canvas state:", state);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    elementId: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    elementId: string | null;
    handle: string | null;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    initialX: number;
    initialY: number;
  }>({
    isResizing: false,
    elementId: null,
    handle: null,
    startX: 0,
    startY: 0,
    initialWidth: 0,
    initialHeight: 0,
    initialX: 0,
    initialY: 0,
  });

  const [rotateState, setRotateState] = useState<{
    isRotating: boolean;
    elementId: string | null;
    startAngle: number;
    initialRotation: number;
    centerX: number;
    centerY: number;
  }>({
    isRotating: false,
    elementId: null,
    startAngle: 0,
    initialRotation: 0,
    centerX: 0,
    centerY: 0,
  });

  const [editingText, setEditingText] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentPage = state.pages.find((p) => p.id === state.currentPageId);
  if (!currentPage) return null;

  const { settings } = currentPage;

  // Auto-update text element height when width/content/styles change
  useEffect(() => {
    // Only auto-update height if not currently resizing this element
    currentPage.elements.forEach((element) => {
      if (
        element.type === "text" &&
        (!resizeState.isResizing || resizeState.elementId !== element.id)
      ) {
        const elementPixels = getElementPixelDimensions(element);
        const widthPx = elementPixels.width;
        const measuredHeightPx = calculateTextHeight(
          element.content || "",
          widthPx,
          element.styles
        );
        const newHeightMm = pxToMm(
          measuredHeightPx / ((state.zoom ?? 100) / 100)
        );
        if (Math.abs(newHeightMm - element.height) > 0.1) {
          updateElement(element.id, { height: newHeightMm });
        }
      }
    });
    // eslint-disable-next-line
  }, [
    currentPage.elements.map((e) => [e.id, e.content, e.width, e.styles]),
    state.zoom,
    resizeState.isResizing,
    resizeState.elementId,
  ]);

  // Accurate conversion functions
  const mmToPx = (mm: number, dpi: number = 96): number => {
    return (mm * dpi) / 25.4;
  };

  const inToPx = (inches: number, dpi: number = 96): number => {
    return inches * dpi;
  };

  const pxToMm = (px: number, dpi: number = 96): number => {
    return (px * 25.4) / dpi;
  };

  // Convert dimensions to pixels for display with accurate conversions
  const getPixelDimensions = () => {
    let width = settings.width;
    let height = settings.height;

    // Convert to pixels based on unit with accurate conversion
    switch (settings.unit) {
      case "mm":
        width = mmToPx(width);
        height = mmToPx(height);
        break;
      case "in":
        width = inToPx(width);
        height = inToPx(height);
        break;
      // 'px' stays as is
    }

    // Apply zoom for preview
    width = (width * (state.zoom ?? 100)) / 100;
    height = (height * (state.zoom ?? 100)) / 100;

    return { width, height };
  };

  const { width, height } = getPixelDimensions();

  // Convert element dimensions to pixels for display
  const getElementPixelDimensions = (element: any) => {
    let elementWidth = element.width;
    let elementHeight = element.height;
    let elementX = element.x;
    let elementY = element.y;

    // Convert from mm (internal storage) to pixels for display
    elementWidth = mmToPx(elementWidth);
    elementHeight = mmToPx(elementHeight);
    elementX = mmToPx(elementX);
    elementY = mmToPx(elementY);

    // Apply zoom
    elementWidth = (elementWidth * (state.zoom ?? 100)) / 100;
    elementHeight = (elementHeight * (state.zoom ?? 100)) / 100;
    elementX = (elementX * (state.zoom ?? 100)) / 100;
    elementY = (elementY * (state.zoom ?? 100)) / 100;

    return {
      width: elementWidth,
      height: elementHeight,
      x: elementX,
      y: elementY,
    };
  };

  const calculateTextHeight = (
    content: string,
    widthPx: number,
    styles: any
  ) => {
    // Create a temporary offscreen div to measure height
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.style.pointerEvents = "none";
    tempDiv.style.zIndex = "-1";
    tempDiv.style.width = `${widthPx}px`;
    tempDiv.style.fontSize = styles.fontSize || "16px";
    tempDiv.style.fontFamily = styles.fontFamily || "inherit";
    tempDiv.style.fontWeight = styles.fontWeight || "normal";
    tempDiv.style.fontStyle = styles.fontStyle || "normal";
    tempDiv.style.lineHeight = styles.lineHeight || "normal";
    tempDiv.style.letterSpacing = styles.letterSpacing || "normal";
    tempDiv.style.textAlign = styles.textAlign || "center";
    tempDiv.style.whiteSpace = "pre-wrap";
    tempDiv.style.wordBreak = "break-all"; // <--- add this
    tempDiv.style.overflowWrap = "break-word"; // <--- add this
    tempDiv.style.padding = "8px 2px 2px 8px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.border = "none";
    tempDiv.style.background = "none";
    tempDiv.textContent = content || "";
    document.body.appendChild(tempDiv);
    const measuredHeightPx = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);
    return measuredHeightPx;
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();

    const element = currentPage.elements.find((el) => el.id === elementId);
    if (!element) return;

    selectElement(elementId);

    setDragState({
      isDragging: true,
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
    });
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    elementId: string,
    handle: string
  ) => {
    e.stopPropagation();

    const element = currentPage.elements.find((el) => el.id === elementId);
    if (!element) return;

    setResizeState({
      isResizing: true,
      elementId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: element.width,
      initialHeight: element.height,
      initialX: element.x,
      initialY: element.y,
    });
  };

  const handleRotateMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();

    const element = currentPage.elements.find((el) => el.id === elementId);
    if (!element) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const elementPixels = getElementPixelDimensions(element);
    const centerX = rect.left + elementPixels.x + elementPixels.width / 2;
    const centerY = rect.top + elementPixels.y + elementPixels.height / 2;

    const startAngle =
      Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    setRotateState({
      isRotating: true,
      elementId,
      startAngle,
      initialRotation: element.rotation || 0,
      centerX,
      centerY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.isDragging && dragState.elementId) {
      const deltaX =
        (e.clientX - dragState.startX) * (100 / (state.zoom ?? 100));
      const deltaY =
        (e.clientY - dragState.startY) * (100 / (state.zoom ?? 100));

      // Convert pixel delta back to mm for storage
      const deltaMmX = pxToMm(deltaX);
      const deltaMmY = pxToMm(deltaY);

      // const newX = Math.max(0, dragState.initialX + deltaMmX);
      // const newY = Math.max(0, dragState.initialY + deltaMmY);

      const newX = dragState.initialX + deltaMmX;
      const newY = dragState.initialY + deltaMmY;

      updateElement(dragState.elementId, { x: newX, y: newY });
    }

    if (resizeState.isResizing && resizeState.elementId) {
      const element = currentPage.elements.find(
        (el) => el.id === resizeState.elementId
      );
      if (!element) return;

      const deltaX =
        (e.clientX - resizeState.startX) * (100 / (state.zoom ?? 100));
      // Only use deltaX for text elements
      const deltaY =
        (e.clientY - resizeState.startY) * (100 / (state.zoom ?? 100));

      // Get rotation in radians (negative to rotate mouse delta into element's local space)
      const rotation = (element.rotation || 0) * (Math.PI / 180);
      const cos = Math.cos(-rotation);
      const sin = Math.sin(-rotation);

      // Rotate the delta
      const localDeltaX = deltaX * cos - deltaY * sin;
      const localDeltaY = deltaX * sin + deltaY * cos;

      // Convert pixel delta back to mm for storage
      const deltaMmX = pxToMm(localDeltaX);
      const deltaMmY = pxToMm(localDeltaY);

      let newWidth = resizeState.initialWidth;
      let newHeight = resizeState.initialHeight;
      let newX = resizeState.initialX;
      let newY = resizeState.initialY;

      if (element.type === "text") {
        // Only allow width resizing for text
        switch (resizeState.handle) {
          case "e":
          case "ne":
          case "se":
            newWidth = Math.max(
              pxToMm(40),
              resizeState.initialWidth + deltaMmX
            );
            break;
          case "w":
          case "nw":
          case "sw":
            newWidth = Math.max(
              pxToMm(40),
              resizeState.initialWidth - deltaMmX
            );
            // Move x in rotated space
            {
              const dx = resizeState.initialWidth - newWidth;
              const rot = (element.rotation || 0) * (Math.PI / 180);
              newX = resizeState.initialX + dx * Math.cos(rot);
              newY = resizeState.initialY + dx * Math.sin(rot);
            }
            break;
          default:
            // For n/s handles, ignore resizing for text
            break;
        }

        // Auto-calculate height based on content and new width
        const widthPx = (mmToPx(newWidth) * (state.zoom ?? 100)) / 100;
        const measuredHeightPx = calculateTextHeight(
          element.content || "",
          widthPx,
          element.styles
        );
        const newHeight = pxToMm(
          measuredHeightPx / ((state.zoom ?? 100) / 100)
        );

        updateElement(resizeState.elementId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      } else {
        switch (resizeState.handle) {
          case "se":
            newWidth = Math.max(
              pxToMm(20),
              resizeState.initialWidth + deltaMmX
            );
            newHeight = Math.max(
              pxToMm(20),
              resizeState.initialHeight + deltaMmY
            );
            break;
          case "sw":
            newWidth = Math.max(
              pxToMm(20),
              resizeState.initialWidth - deltaMmX
            );
            newHeight = Math.max(
              pxToMm(20),
              resizeState.initialHeight + deltaMmY
            );
            // Move x in rotated space
            {
              const dx = resizeState.initialWidth - newWidth;
              const dy = 0;
              const rot = (element.rotation || 0) * (Math.PI / 180);
              newX =
                resizeState.initialX + dx * Math.cos(rot) - dy * Math.sin(rot);
              newY =
                resizeState.initialY + dx * Math.sin(rot) + dy * Math.cos(rot);
            }
            break;
          case "ne":
            newWidth = Math.max(
              pxToMm(20),
              resizeState.initialWidth + deltaMmX
            );
            newHeight = Math.max(
              pxToMm(20),
              resizeState.initialHeight - deltaMmY
            );
            // Move y in rotated space
            {
              const dx = 0;
              const dy = resizeState.initialHeight - newHeight;
              const rot = (element.rotation || 0) * (Math.PI / 180);
              newX =
                resizeState.initialX + dx * Math.cos(rot) - dy * Math.sin(rot);
              newY =
                resizeState.initialY + dx * Math.sin(rot) + dy * Math.cos(rot);
            }
            break;
          case "nw":
            newWidth = Math.max(
              pxToMm(20),
              resizeState.initialWidth - deltaMmX
            );
            newHeight = Math.max(
              pxToMm(20),
              resizeState.initialHeight - deltaMmY
            );
            // Move x and y in rotated space
            {
              const dx = resizeState.initialWidth - newWidth;
              const dy = resizeState.initialHeight - newHeight;
              const rot = (element.rotation || 0) * (Math.PI / 180);
              newX =
                resizeState.initialX + dx * Math.cos(rot) - dy * Math.sin(rot);
              newY =
                resizeState.initialY + dx * Math.sin(rot) + dy * Math.cos(rot);
            }
            break;
          case "n":
            newHeight = Math.max(
              pxToMm(20),
              resizeState.initialHeight - deltaMmY
            );
            // Move y in rotated space
            {
              const dx = 0;
              const dy = resizeState.initialHeight - newHeight;
              const rot = (element.rotation || 0) * (Math.PI / 180);
              newX =
                resizeState.initialX + dx * Math.cos(rot) - dy * Math.sin(rot);
              newY =
                resizeState.initialY + dx * Math.sin(rot) + dy * Math.cos(rot);
            }
            break;
          case "s":
            newHeight = Math.max(
              pxToMm(20),
              resizeState.initialHeight + deltaMmY
            );
            break;
          case "e":
            newWidth = Math.max(
              pxToMm(20),
              resizeState.initialWidth + deltaMmX
            );
            break;
          case "w":
            newWidth = Math.max(
              pxToMm(20),
              resizeState.initialWidth - deltaMmX
            );
            // Move x in rotated space
            {
              const dx = resizeState.initialWidth - newWidth;
              const dy = 0;
              const rot = (element.rotation || 0) * (Math.PI / 180);
              newX =
                resizeState.initialX + dx * Math.cos(rot) - dy * Math.sin(rot);
              newY =
                resizeState.initialY + dx * Math.sin(rot) + dy * Math.cos(rot);
            }
            break;
        }
      }

      updateElement(resizeState.elementId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }

    if (rotateState.isRotating && rotateState.elementId) {
      const currentAngle =
        Math.atan2(
          e.clientY - rotateState.centerY,
          e.clientX - rotateState.centerX
        ) *
        (180 / Math.PI);

      const deltaAngle = currentAngle - rotateState.startAngle;
      let newRotation = rotateState.initialRotation + deltaAngle;

      // Normalize rotation to 0-360 degrees
      newRotation = ((newRotation % 360) + 360) % 360;

      updateElement(rotateState.elementId, {
        rotation: Math.round(newRotation * 100) / 100,
      });
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      elementId: null,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
    });

    setResizeState({
      isResizing: false,
      elementId: null,
      handle: null,
      startX: 0,
      startY: 0,
      initialWidth: 0,
      initialHeight: 0,
      initialX: 0,
      initialY: 0,
    });

    setRotateState({
      isRotating: false,
      elementId: null,
      startAngle: 0,
      initialRotation: 0,
      centerX: 0,
      centerY: 0,
    });
  };

  const handleTextDoubleClick = (elementId: string) => {
    setEditingText(elementId);
  };

  const handleTextChange = (elementId: string, newContent: string) => {
    updateElement(elementId, { content: newContent });
  };

  const handleTextBlur = () => {
    setEditingText(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectElement(undefined);
      setEditingText(null);
    }
  };

  const handleImageUpload = (elementId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, SVG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const fileName = file.name;
      console.log("image name", e);
      updateElement(elementId, {
        content: fileName,
        styles: {
          ...currentPage.elements.find((el) => el.id === elementId)?.styles,
          backgroundImage: imageUrl,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const ResizeHandles: React.FC<{ elementId: string }> = ({ elementId }) => {
    const element = currentPage.elements.find((el) => el.id === elementId);
    const handles =
      element?.type === "text"
        ? ["w", "e"]
        : ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

    return (
      <>
        {handles.map((handle) => (
          <div
            key={handle}
            className={`absolute w-2 h-2 bg-indigo-500 border border-white cursor-${handle}-resize`}
            style={{
              top: handle.includes("n")
                ? "-4px"
                : handle.includes("s")
                ? "calc(100% - 4px)"
                : "calc(50% - 4px)",
              left: handle.includes("w")
                ? "-4px"
                : handle.includes("e")
                ? "calc(100% - 4px)"
                : "calc(50% - 4px)",
              transform: "translate(0, 0)",
              zIndex: 1000,
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, elementId, handle)}
          />
        ))}
      </>
    );
  };

  const RotateHandle: React.FC<{ elementId: string }> = ({ elementId }) => (
    <div
      className="absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-grab hover:cursor-grabbing"
      style={{
        top: "-20px",
        left: "50%",
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => handleRotateMouseDown(e, elementId)}
      title="Drag to rotate"
    >
      <div className="absolute w-px h-4 bg-green-500 left-1/2 top-3 transform -translate-x-1/2" />
    </div>
  );
  const sortedElements = [...currentPage.elements].sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  return (
    <div className="relative">
      {/* Rulers */}
      {state.showRulers && (
        <>
          {/* Horizontal Ruler */}
          <div
            className="absolute -top-6 left-0 h-6 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600"
            style={{ width: width }}
          >
            <div className="relative h-full">
              {Array.from({ length: Math.ceil(width / 50) }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-600"
                  style={{ left: i * 50 }}
                >
                  <span className="absolute top-0 left-1 text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(pxToMm((i * 50 * 100) / (state.zoom ?? 100)))}mm
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Ruler */}
          <div
            className="absolute -left-6 top-0 w-6 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600"
            style={{ height: height }}
          >
            <div className="relative w-full h-full">
              {Array.from({ length: Math.ceil(height / 50) }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-full border-t border-gray-300 dark:border-gray-600"
                  style={{ top: i * 50 }}
                >
                  <span
                    className="absolute left-0 top-1 text-xs text-gray-500 dark:text-gray-400 transform -rotate-90 origin-left"
                    style={{ transformOrigin: "0 0" }}
                  >
                    {Math.round(pxToMm((i * 50 * 100) / (state.zoom ?? 100)))}mm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Page */}
      <div
        ref={canvasRef}
        data-canvas="true"
        className="relative bg-white shadow-lg border border-gray-300 dark:border-gray-600 select-none"
        style={{
          width: width,
          height: height,
          backgroundColor: settings.backgroundColor,
          cursor: dragState.isDragging ? "grabbing" : "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Grid */}
        {state.showGrid && (
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: `${
                ((state.gridSize ?? 10) * (state.zoom ?? 100)) / 100
              }px ${((state.gridSize ?? 10) * (state.zoom ?? 100)) / 100}px`,
            }}
          />
        )}

        {/* Margins */}
        <div
          className="absolute border border-dashed border-gray-400 dark:border-gray-500 opacity-50 pointer-events-none"
          style={{
            top: (mmToPx(settings.margins.top) * (state.zoom ?? 100)) / 100,
            left: (mmToPx(settings.margins.left) * (state.zoom ?? 100)) / 100,
            right: (mmToPx(settings.margins.right) * (state.zoom ?? 100)) / 100,
            bottom:
              (mmToPx(settings.margins.bottom) * (state.zoom ?? 100)) / 100,
          }}
        />

        {/* Elements */}
        {sortedElements.map((element) => {
          const isSelected = state.selectedElementIds?.includes(element.id);
          const isEditing = editingText === element.id;
          const elementPixels = getElementPixelDimensions(element);

          return (
            <div
              key={element.id}
              className={`absolute group ${
                isSelected
                  ? "ring-2 ring-indigo-500"
                  : "hover:ring-2 hover:ring-gray-400"
              }`}
              style={{
                left: elementPixels.x,
                top: elementPixels.y,
                width: elementPixels.width,
                height: elementPixels.height,
                transform: `rotate(${element.rotation || 0}deg)`,
                transformOrigin: "center center",
                cursor:
                  dragState.isDragging && dragState.elementId === element.id
                    ? "grabbing"
                    : "grab",
                ...(element.styles as React.CSSProperties),
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element.id)}
            >
              {element.type === "text" && (
                <div className="w-full h-full flex items-center justify-center relative">
                  {isEditing ? (
                    <textarea
                      ref={(el) => {
                        if (el) {
                          // Auto-resize logic
                          el.style.height = "auto";
                          el.style.height = `${el.scrollHeight}px`;
                          // Update element height in mm
                          const measuredHeightPx = el.scrollHeight;
                          const newHeightMm = pxToMm(
                            measuredHeightPx / ((state.zoom ?? 100) / 100)
                          );
                          if (Math.abs(newHeightMm - element.height) > 0.1) {
                            updateElement(element.id, { height: newHeightMm });
                          }
                        }
                      }}
                      value={element.content || ""}
                      onChange={(e) =>
                        handleTextChange(element.id, e.target.value)
                      }
                      onBlur={handleTextBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleTextBlur();
                        }
                        if (e.key === "Escape") {
                          handleTextBlur();
                        }
                      }}
                      className="w-full h-full resize-none border-none outline-none bg-transparent"
                      style={{
                        fontSize: element.styles.fontSize,
                        fontFamily: element.styles.fontFamily,
                        color: element.styles.color,
                        textAlign:
                          (element.styles?.textAlign as any) || "center",
                        overflow: "hidden",
                        minHeight: "32px",
                        padding: "8px 2px 2px 8px",
                        boxSizing: "border-box",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all", // <--- add this
                        overflowWrap: "break-word",
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="w-full h-full relative"
                      style={{
                        fontSize: element.styles.fontSize,
                        fontFamily: element.styles.fontFamily,
                        color: element.styles.color,
                        textAlign:
                          (element.styles?.textAlign as any) || "center",
                        backgroundColor: element.styles.backgroundColor,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all", // <--- add this
                        overflowWrap: "break-word",
                      }}
                      onDoubleClick={() => handleTextDoubleClick(element.id)}
                    >
                      {element.content || "Double-click to edit"}
                    </div>
                  )}
                </div>
              )}

              {element.type === "shape" && <div className="w-full h-full" />}

              {element.type === "line" && <div className="w-full h-full" />}

              {element.type === "image" && (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm relative">
                  {element.styles.backgroundImage ? (
                    <img
                      src={element.styles.backgroundImage}
                      alt="Uploaded content"
                      className="w-full h-full overflow-hidden"
                      style={{
                        objectFit: element.styles?.objectFit || "cover",
                        borderRadius: element.styles.borderRadius,
                      }}
                    />
                  ) : (
                    <>
                      <span>Drop image here or click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(element.id, file);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              )}

              {/* Resize Handles */}
              {isSelected && !isEditing && (
                <>
                  <ResizeHandles elementId={element.id} />
                  <RotateHandle elementId={element.id} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Canvas;
