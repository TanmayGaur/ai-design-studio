import {
  PDFDocument,
  rgb,
  StandardFonts,
  pushGraphicsState,
  popGraphicsState,
  rotateRadians,
  translate,
  PDFPage,
} from "pdf-lib";

export async function generateHighQualityPDF(pages: any[],filename:string) {
  const pdfDoc = await PDFDocument.create();

  const fontCache: { [key: string]: any } = {};

  async function getFontByStyle(family: string, weight: string, style: string) {
    const f = family.toLowerCase();
    const isBold = weight === "bold";
    const isItalic = style === "italic";

    const key = `${f}-${isBold ? "bold" : "normal"}-${
      isItalic ? "italic" : "normal"
    }`;
    if (fontCache[key]) return fontCache[key];

    if (f.includes("times")) {
      if (isBold && isItalic)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.TimesRomanBoldItalic
        ));
      if (isBold)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.TimesRomanBold
        ));
      if (isItalic)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.TimesRomanItalic
        ));
      return (fontCache[key] = await pdfDoc.embedFont(
        StandardFonts.TimesRoman
      ));
    } else if (f.includes("courier")) {
      if (isBold && isItalic)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.CourierBoldOblique
        ));
      if (isBold)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.CourierBold
        ));
      if (isItalic)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.CourierOblique
        ));
      return (fontCache[key] = await pdfDoc.embedFont(StandardFonts.Courier));
    } else {
      if (isBold && isItalic)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.HelveticaBoldOblique
        ));
      if (isBold)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.HelveticaBold
        ));
      if (isItalic)
        return (fontCache[key] = await pdfDoc.embedFont(
          StandardFonts.HelveticaOblique
        ));
      return (fontCache[key] = await pdfDoc.embedFont(StandardFonts.Helvetica));
    }
  }

  const mmToPt = (mm: number) => (mm / 25.4) * 72;

  function hexToRgb(hex: string): [number, number, number] {
    hex = hex.replace("#", "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((h) => h + h)
        .join("");
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }

  function rotateAroundCenter(
    page: PDFPage,
    drawFn: () => void,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ): void {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    page.pushOperators(
      pushGraphicsState(),
      translate(centerX, centerY),
      rotateRadians((-rotation * Math.PI) / 180),
      translate(-centerX, -centerY)
    );

    drawFn();

    page.pushOperators(popGraphicsState());
  }

  function wrapText(
    text: string,
    font: any,
    fontSize: number,
    maxWidth: number
  ): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth <= maxWidth / 1.7) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  for (const pageData of pages) {
    let widthPt = mmToPt(pageData.settings.width);
    let heightPt = mmToPt(pageData.settings.height);

    // if (pageData.settings.orientation === 'landscape') {
    //   [widthPt, heightPt] = [heightPt, widthPt];
    // }

    const page = pdfDoc.addPage([widthPt, heightPt]);

    const [bgR, bgG, bgB] = hexToRgb(
      pageData.settings.backgroundColor || "#ffffff"
    );
    page.drawRectangle({
      x: 0,
      y: 0,
      width: widthPt,
      height: heightPt,
      color: rgb(bgR / 255, bgG / 255, bgB / 255),
    });

    const sortedElements = [...pageData.elements].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    for (const el of sortedElements) {
      const x = mmToPt(el.x);
      const y = heightPt - mmToPt(el.y) - mmToPt(el.height || 0);
      const width = mmToPt(el.width || 0);
      const height = mmToPt(el.height || 0);
      const rotation = el.rotation || 0;

      if (el.type === "text") {
        const fontSize = parseInt(
          el.styles.fontSize?.replace("px", "") || "16"
        );
        const [r, g, b] = hexToRgb(el.styles.color || "#000000");
        const font = await getFontByStyle(
          el.styles.fontFamily || "",
          el.styles.fontWeight || "normal",
          el.styles.fontStyle || "normal"
        );

        const lines = wrapText(el.content, font, fontSize, width);
        const lineHeight = fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;

        // Calculate vertical offset so the text block's center matches the element's center
        const elementCenterY = y + height / 2;
        const textBlockCenterY =
          y + (height - totalTextHeight) / 2 + totalTextHeight / 2;
        const yOffset = elementCenterY - textBlockCenterY;

        rotateAroundCenter(
          page,
          () => {
            lines.forEach((line, idx) => {
              let drawX = x;
              if (el.styles.textAlign === "center") {
                const lineWidth = font.widthOfTextAtSize(line, fontSize);
                drawX = x + (width - lineWidth) / 2;
              } else if (el.styles.textAlign === "right") {
                const lineWidth = font.widthOfTextAtSize(line, fontSize);
                drawX = x + (width - lineWidth);
              }
              // Y position: start from top, move down by lineHeight, apply yOffset
              const lineY = y + height - (idx + 1) * lineHeight + yOffset;

              page.drawText(line, {
                x: drawX,
                y: lineY,
                size: fontSize,
                font,
                color: rgb(r / 255, g / 255, b / 255),
              });

              if (el.styles.textDecoration === "underline") {
                const textWidth = font.widthOfTextAtSize(line, fontSize);
                const underlineY = lineY - fontSize * 0.1;
                page.drawLine({
                  start: { x: drawX, y: underlineY },
                  end: { x: drawX + textWidth, y: underlineY },
                  thickness: 0.5,
                  color: rgb(r / 255, g / 255, b / 255),
                });
              }
            });
          },
          x,
          y,
          width,
          height,
          rotation
        );
      } else if (el.type === "shape") {
        const [r, g, b] = hexToRgb(el.styles.backgroundColor || "#ffffff");
        const isCircle = el.styles.borderRadius === "50%";

        rotateAroundCenter(
          page,
          () => {
            if (isCircle) {
              const radius = width / 2;
              page.drawEllipse({
                x: x + radius,
                y: y + radius,
                xScale: radius,
                yScale: radius,
                color: rgb(r / 255, g / 255, b / 255),
              });
            } else {
              page.drawRectangle({
                x,
                y,
                width,
                height,
                color: rgb(r / 255, g / 255, b / 255),
              });
            }
          },
          x,
          y,
          width,
          height,
          rotation
        );
      } else if (el.type === "image") {
        try {
          const imageData = el.styles.backgroundImage;
          const isPng = imageData.includes("data:image/png");
          const base64 = imageData.split(",")[1];
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const img = isPng
            ? await pdfDoc.embedPng(bytes)
            : await pdfDoc.embedJpg(bytes);

          rotateAroundCenter(
            page,
            () => {
              page.drawImage(img, {
                x,
                y,
                width,
                height,
              });
            },
            x,
            y,
            width,
            height,
            rotation
          );
        } catch (e) {
          console.warn("Failed to embed image:", e);
        }
      } else if (el.type === "line") {
        const [r, g, b] = hexToRgb(el.styles.backgroundColor || "#000000");
        const startX = x;
        const startY = y + height / 2;
        const endX = x + width;
        const endY = startY;

        rotateAroundCenter(
          page,
          () => {
            page.drawLine({
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
              thickness: height,
              color: rgb(r / 255, g / 255, b / 255),
            });
          },
          x,
          y,
          width,
          height,
          rotation
        );
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
