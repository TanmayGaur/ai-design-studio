import { jsPDF } from "jspdf";
import { DesignElement, PageSettings } from "../context/DesignContext";

export interface PDFExportOptions {
  filename?: string;
  quality?: number;
  includeMetadata?: boolean;
  pageTitle?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

/**
 * Convert CSS styles to PDF-compatible properties
 */
const convertCSSForPDF = (styles: Record<string, any>) => {
  const pdfStyles: Record<string, any> = {};

  // Color conversions
  if (styles.color) {
    pdfStyles.textColor = styles.color;
  }

  if (styles.backgroundColor) {
    pdfStyles.fillColor = styles.backgroundColor;
  }

  // Font properties
  if (styles.fontSize) {
    const fontSize = parseFloat(styles.fontSize.replace("px", ""));
    pdfStyles.fontSize = fontSize * 0.75; // Convert px to pt
  }

  if (styles.fontFamily) {
    // Map web fonts to PDF fonts
    const fontFamily = styles.fontFamily.toLowerCase();
    if (fontFamily.includes("serif") || fontFamily.includes("times")) {
      pdfStyles.fontName = "times";
    } else if (fontFamily.includes("mono") || fontFamily.includes("courier")) {
      pdfStyles.fontName = "courier";
    } else {
      pdfStyles.fontName = "helvetica";
    }
  }

  if (styles.fontWeight === "bold" || styles.fontWeight === "700") {
    pdfStyles.fontStyle = "bold";
  } else if (styles.fontStyle === "italic") {
    pdfStyles.fontStyle = "italic";
  } else {
    pdfStyles.fontStyle = "normal";
  }

  // Text alignment
  if (styles.textAlign) {
    pdfStyles.textAlign = styles.textAlign;
  }

  // Border radius for shapes
  if (styles.borderRadius) {
    pdfStyles.borderRadius = parseFloat(styles.borderRadius.replace("px", ""));
  }

  // Opacity
  if (styles.opacity !== undefined) {
    pdfStyles.opacity = parseFloat(styles.opacity);
  }

  // Line height
  if (styles.lineHeight) {
    pdfStyles.lineHeight = parseFloat(styles.lineHeight);
  }

  return pdfStyles;
};

/**
 * Export canvas to PDF with exact 1:1 reproduction
 */
export const exportCanvasToPDF = async (
  pageSettings: PageSettings,
  elements: DesignElement[],
  options: PDFExportOptions = {}
): Promise<void> => {
  try {
    const {
      filename = "design-export.pdf",
      includeMetadata = true,
      pageTitle = "Design Export",
      author = "Design Studio",
      subject = "Generated Design",
      keywords = ["design", "export"],
    } = options;

    // Create PDF with exact page dimensions
    const pdf = new jsPDF({
      orientation: pageSettings.orientation,
      unit: "mm",
      format: [pageSettings.width, pageSettings.height],
    });

    // Add metadata if requested
    if (includeMetadata) {
      pdf.setProperties({
        title: pageTitle,
        author: author,
        subject: subject,
        keywords: keywords.join(", "),
        creator: "Design Studio",
      });
    }

    // Set background color
    if (
      pageSettings.backgroundColor &&
      pageSettings.backgroundColor !== "#ffffff"
    ) {
      pdf.setFillColor(pageSettings.backgroundColor);
      pdf.rect(0, 0, pageSettings.width, pageSettings.height, "F");
    }

    // Sort elements by z-index to maintain stacking order
    const sortedElements = [...elements].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    // Render each element precisely
    for (const element of sortedElements) {
      // Skip hidden elements
      if (
        element.styles.visibility === "hidden" ||
        element.styles.display === "none"
      ) {
        continue;
      }

      await renderElementToPDF(pdf, element);
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error("PDF export failed:", error);
    throw new Error("Failed to export PDF. Please try again.");
  }
};

/**
 * Render individual element to PDF with exact styling
 */
const renderElementToPDF = async (
  pdf: jsPDF,
  element: DesignElement
): Promise<void> => {
  const { x, y, width, height, styles } = element;
  const pdfStyles = convertCSSForPDF(styles);

  switch (element.type) {
    case "text":
      renderTextElementToPDF(pdf, element, x, y, width, height, pdfStyles);
      break;
    case "shape":
      renderShapeElementToPDF(pdf, element, x, y, width, height, pdfStyles);
      break;
    case "line":
      renderLineElementToPDF(pdf, element, x, y, width, height, pdfStyles);
      break;
    case "image":
      renderImageElementToPDF(pdf, element, x, y, width, height, pdfStyles);
      break;
  }
};

/**
 * Render text element to PDF with exact formatting
 */
const renderTextElementToPDF = (
  pdf: jsPDF,
  element: DesignElement,
  x: number,
  y: number,
  width: number,
  height: number,
  pdfStyles: Record<string, any>
): void => {
  const { content = "", styles, rotation = 0 } = element;

  if (!content.trim()) return;

  // Apply text color
  if (styles.color) {
    pdf.setTextColor(styles.color);
  }

  // Apply font properties
  if (styles.fontSize) {
    // Parse font size from string like '12px' to number
    const fontSize =
      typeof styles.fontSize === "string"
        ? parseFloat(styles.fontSize.replace("px", ""))
        : styles.fontSize;
    pdf.setFontSize(fontSize);
  }

  // Apply font family and style
  // Determine font family
  let fontName = "helvetica";
  if (styles.fontFamily) {
    const fontFamily = styles.fontFamily.toLowerCase();
    if (fontFamily.includes("arial") || fontFamily.includes("sans-serif")) {
      fontName = "helvetica"; // Arial maps to helvetica in PDF
    } else if (fontFamily.includes("serif") || fontFamily.includes("times")) {
      fontName = "times";
    } else if (fontFamily.includes("mono") || fontFamily.includes("courier")) {
      fontName = "courier";
    }
  }

  // Determine font style (normal, bold, italic, bolditalic)
  let fontStyle = "normal";
  if (styles.fontWeight === "bold" || styles.fontWeight === "700") {
    fontStyle = styles.fontStyle === "italic" ? "bolditalic" : "bold";
  } else if (styles.fontStyle === "italic") {
    fontStyle = "italic";
  }

  // Apply font settings
  pdf.setFont(fontName, fontStyle);

  // Handle background color for text
  if (styles.backgroundColor && styles.backgroundColor !== "transparent") {
    pdf.setFillColor(styles.backgroundColor);
    pdf.rect(x, y, width, height, "F");
  }

  // Calculate text positioning
  const padding = 2; // 2mm padding
  const lineHeight = pdfStyles.lineHeight || 1.4;
  const fontSize = pdfStyles.fontSize || 12;
  const actualLineHeight = fontSize * lineHeight;

  // Split text into lines
  const lines = pdf.splitTextToSize(content, width - padding * 2);
  const totalTextHeight = lines.length * actualLineHeight;

  // Calculate vertical alignment
  let startY = padding + fontSize; // Start from top with font size offset

  // Handle vertical alignment based on CSS styles
  if (styles.display === "flex") {
    if (styles.alignItems === "center") {
      startY = (height - totalTextHeight) / 2 + fontSize;
    } else if (styles.alignItems === "flex-end") {
      startY = height - totalTextHeight + fontSize - padding;
    }
  }

  // Render each line with proper alignment and rotation
  lines.forEach((line: string, index: number) => {
    const lineY = y + startY + index * actualLineHeight;

    let lineX = x + padding;
    const textAlign = pdfStyles.textAlign || styles.textAlign || "left";

    if (textAlign === "center") {
      lineX = x + width / 2;
    } else if (textAlign === "right") {
      lineX = x + width - padding;
    }

    if (rotation > 0) {
      const textWidth = pdf.getStringUnitWidth(line) * fontSize;
      const textHeight = fontSize;

      // Calculate center position
      const centerX = x + textWidth / 2;
      const centerY = y + textHeight / 2;

      // Draw text at (centerX, centerY) with offset and rotation
      pdf.text(line, centerX, centerY, {
        align: textAlign as any,
        angle: -rotation || 0,
      });
    } else {
      pdf.text(line, lineX, lineY, {
        align: textAlign as any,
        angle: -rotation || 0,
      });
    }
    // Handle text decoration (underline)
    if (styles.textDecoration === "underline") {
      // pdf.setTextColor(styles.color || '#000000');
      // pdf.setDrawColor(styles.color || '#000000');
      // pdf.setLineWidth(0.5); // Default underline thickness
      const textWidth = pdf.getTextWidth(line);
      pdf.line(lineX, lineY + 1, lineX + textWidth, lineY + 1);
    }
  });
};

/**
 * Render shape element to PDF with exact styling
 */
const renderShapeElementToPDF = (
  pdf: jsPDF,
  element: DesignElement,
  x: number,
  y: number,
  width: number,
  height: number,
  pdfStyles: Record<string, any>
): void => {
  const { styles, rotation = 0 } = element;

  // Apply fill color
  if (pdfStyles.fillColor) {
    pdf.setFillColor(pdfStyles.fillColor);
  }

  // Apply opacity
  if (pdfStyles.opacity !== undefined && pdfStyles.opacity < 1) {
    pdf.setGState(new (pdf as any).GState({ opacity: pdfStyles.opacity }));
  }

  const borderRadius = pdfStyles.borderRadius || 0;

  if (borderRadius > 0 && borderRadius >= Math.min(width, height) / 2) {
    // Circle/ellipse
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    pdf.ellipse(centerX, centerY, radiusX, radiusY, "F");
  } else if (borderRadius > 0) {
    // Rounded rectangle
    if (rotation == 90) {
      pdf.roundedRect(
        x + height / 2,
        y - width / 2,
        height,
        width,
        borderRadius,
        borderRadius,
        "F"
      );
    } else {
      pdf.roundedRect(x, y, width, height, borderRadius, borderRadius, "F");
    }
  } else {
    // Regular rectangle
    if (rotation == 90) {
      pdf.rect(x + height / 2, y - width / 2, height, width, "F");
    } else {
      pdf.rect(x, y, width, height, "F");
    }
  }

  // Handle borders if specified
  if (styles.border || styles.borderWidth) {
    const borderWidth = parseFloat(styles.borderWidth || "1");
    const borderColor = styles.borderColor || "#000000";

    pdf.setDrawColor(borderColor);
    pdf.setLineWidth(borderWidth);

    if (borderRadius > 0) {
      pdf.roundedRect(x, y, width, height, borderRadius, borderRadius, "S");
    } else {
      pdf.rect(x, y, width, height, "S");
    }
  }
};

/**
 * Render line element to PDF
 */
const renderLineElementToPDF = (
  pdf: jsPDF,
  element: DesignElement,
  x: number,
  y: number,
  width: number,
  height: number,
  pdfStyles: Record<string, any>
): void => {
  const { styles, rotation = 0 } = element;

  const color = pdfStyles.fillColor || styles.backgroundColor || "#000000";
  const lineWidth = Math.max(height, 0.1);

  pdf.setDrawColor(color);
  pdf.setLineWidth(lineWidth);

  // Apply opacity
  if (pdfStyles.opacity !== undefined && pdfStyles.opacity < 1) {
    pdf.setGState(new (pdf as any).GState({ opacity: pdfStyles.opacity }));
  }

  const angle = rotation * (Math.PI / 180); // Convert degrees to radians

  // Calculate rotated endpoint
  const x2 = x + width * Math.cos(angle);
  const y2 = y + width * Math.sin(angle);

  pdf.line(x, y, x2, y2); // Draw rotated line

  // pdf.line(x, y + height / 2, x + width, y + height / 2);
};

/**
 * Render image element to PDF
 */
const renderImageElementToPDF = async (
  pdf: jsPDF,
  element: DesignElement,
  x: number,
  y: number,
  width: number,
  height: number,
  pdfStyles: Record<string, any>
): Promise<void> => {
  const { content, styles, rotation = 0 } = element;

  if (!content) {
    // Draw placeholder
    pdf.setFillColor("#f3f4f6");
    pdf.rect(x, y, width, height, "F");
    pdf.setTextColor("#666666");
    pdf.setFontSize(10);
    pdf.text("Image", x + width / 2, y + height / 2, { align: "center" });
    return;
  }

  try {
    // Apply opacity
    if (pdfStyles.opacity !== undefined && pdfStyles.opacity < 1) {
      pdf.setGState(new (pdf as any).GState({ opacity: pdfStyles.opacity }));
    }

    if (styles.backgroundImage?.startsWith("data:image/")) {
      // Handle base64 images
      const format =
        styles.backgroundImage.includes("jpeg") ||
        styles.backgroundImage?.includes("jpg")
          ? "JPEG"
          : "PNG";

      // Handle object-fit styles
      const objectFit = styles.objectFit || "cover";

      if (objectFit === "contain") {
        // Calculate dimensions to fit within bounds while maintaining aspect ratio
        const img = new Image();
        img.src = styles.backgroundImage;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const aspectRatio = img.width / img.height;
        const containerAspectRatio = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let offsetX = x;
        let offsetY = y;

        if (aspectRatio > containerAspectRatio) {
          drawHeight = width / aspectRatio;
          offsetY = y + (height - drawHeight) / 2;
        } else {
          drawWidth = height * aspectRatio;
          offsetX = x + (width - drawWidth) / 2;
        }

        pdf.addImage(
          styles.backgroundImage,
          format,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight,
          undefined,
          "NONE",
          -rotation || 0
        );
      } else {
        // Default to cover behavior
        pdf.addImage(
          styles.backgroundImage,
          format,
          x,
          y,
          width,
          height,
          undefined,
          "NONE",
          -rotation || 0
        );
      }
    } else {
      // For URL images, show placeholder
      pdf.setFillColor("#f3f4f6");
      pdf.rect(x, y, width, height, "F");
      pdf.setTextColor("#666666");
      pdf.setFontSize(8);
      pdf.text("External Image", x + width / 2, y + height / 2, {
        align: "center",
      });
    }
  } catch (error) {
    console.error("Failed to render image:", error);
    // Draw error placeholder
    pdf.setFillColor("#fee2e2");
    pdf.rect(x, y, width, height, "F");
    pdf.setTextColor("#dc2626");
    pdf.setFontSize(8);
    pdf.text("Image Error", x + width / 2, y + height / 2, { align: "center" });
  }
};

/**
 * Export multiple pages to PDF
 */
export const exportMultiplePagesToPDF = async (
  pages: Array<{
    settings: PageSettings;
    elements: DesignElement[];
    canvasElement: HTMLElement;
  }>,
  options: PDFExportOptions = {}
): Promise<void> => {
  if (pages.length === 0) {
    throw new Error("No pages to export");
  }

  const {
    filename = "multi-page-design.pdf",
    includeMetadata = true,
    pageTitle = "Multi-Page Design",
    author = "Design Studio",
  } = options;

  // Use the first page's settings for the PDF format
  const firstPage = pages[0];
  const pdf = new jsPDF({
    orientation: firstPage.settings.orientation,
    unit: "mm",
    format: [firstPage.settings.width, firstPage.settings.height],
  });

  // Add metadata
  if (includeMetadata) {
    pdf.setProperties({
      title: pageTitle,
      author: author,
      subject: "Multi-page Design Export",
      creator: "Design Studio",
    });
  }

  // Export each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Add new page if not the first one
    if (i > 0) {
      pdf.addPage(
        [page.settings.width, page.settings.height],
        page.settings.orientation
      );
    }

    // Set background color
    if (
      page.settings.backgroundColor &&
      page.settings.backgroundColor !== "#ffffff"
    ) {
      pdf.setFillColor(page.settings.backgroundColor);
      pdf.rect(0, 0, page.settings.width, page.settings.height, "F");
    }

    // Sort elements by z-index
    const sortedElements = [...page.elements].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    // Render elements
    for (const element of sortedElements) {
      if (
        element.styles.visibility === "hidden" ||
        element.styles.display === "none"
      ) {
        continue;
      }
      await renderElementToPDF(pdf, element);
    }
  }

  // Save the PDF
  pdf.save(filename);
};

/**
 * Get PDF export preview (returns base64 data URL)
 */
export const getPDFPreview = async (
  pageSettings: PageSettings,
  elements: DesignElement[]
): Promise<string> => {
  const pdf = new jsPDF({
    orientation: pageSettings.orientation,
    unit: "mm",
    format: [pageSettings.width, pageSettings.height],
  });

  // Set background
  if (
    pageSettings.backgroundColor &&
    pageSettings.backgroundColor !== "#ffffff"
  ) {
    pdf.setFillColor(pageSettings.backgroundColor);
    pdf.rect(0, 0, pageSettings.width, pageSettings.height, "F");
  }

  // Sort and render elements
  const sortedElements = [...elements].sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  for (const element of sortedElements) {
    if (
      element.styles.visibility === "hidden" ||
      element.styles.display === "none"
    ) {
      continue;
    }
    await renderElementToPDF(pdf, element);
  }

  // Return as data URL
  return pdf.output("datauristring");
};
