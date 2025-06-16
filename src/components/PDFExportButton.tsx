import React, { useState } from "react";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useDesign } from "../context/DesignContext";
import {
  exportMultiplePagesToPDF,
  PDFExportOptions,
} from "../utils/pdfExportHelpers";
import { generateHighQualityPDF } from "../utils/generatePDF";

const PDFExportButton: React.FC = () => {
  const { state } = useDesign();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    filename: "design-export.pdf",
    quality: 1.0,
    includeMetadata: true,
    pageTitle: "Design Export",
    author: "Design Studio",
    subject: "Generated Design",
    keywords: ["design", "export"],
  });

  const currentPage = state.pages.find((p) => p.id === state.currentPageId);

  const handleExportAllPages = async (tool = "pdf-lib") => {
    setIsExporting(true);
    setExportStatus("idle");

    try {
      const pagesData = state.pages.map((page) => {
        const canvasElement = document.querySelector(
          '[data-canvas="true"]'
        ) as HTMLElement;
        return {
          settings: page.settings,
          elements: page.elements,
          canvasElement: canvasElement || document.createElement("div"),
        };
      });

      if (tool === "jspdf") {
        await exportMultiplePagesToPDF(pagesData, {
          ...exportOptions,
          filename: exportOptions.filename || "all-pages-export.pdf",
          pageTitle: "Multi-Page Design Export",
        });
      } else {
        generateHighQualityPDF(state.pages, exportOptions.filename || "all-pages-export.pdf");
      }

      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Exporting...</span>
        </>
      );
    }

    if (exportStatus === "success") {
      return (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Exported!</span>
        </>
      );
    }

    if (exportStatus === "error") {
      return (
        <>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>Failed</span>
        </>
      );
    }

    return (
      <>
        <Download className="h-4 w-4" />
        <span>Export PDF</span>
      </>
    );
  };

  const getButtonClass = () => {
    const baseClass =
      "flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    if (exportStatus === "success") {
      return `${baseClass} bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700`;
    }

    if (exportStatus === "error") {
      return `${baseClass} bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700`;
    }

    return `${baseClass} bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm`;
  };

  return (
    <div className="relative">
      {/* Main Export Button */}
      <div className="flex items-center space-x-2">
        {/* Options Toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={
            isExporting || !currentPage || currentPage.elements.length === 0
          }
          className={getButtonClass()}
          title="Export current page to PDF"
        >
          {getButtonContent()}
        </button>
      </div>

      {/* Export Options Panel */}
      {showOptions && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            PDF Export Options
          </h3>

          <div className="space-y-4">
            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filename
              </label>
              <input
                type="text"
                value={exportOptions.filename || ""}
                onChange={(e) =>
                  setExportOptions((prev) => ({
                    ...prev,
                    filename: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="design-export.pdf"
              />
            </div>

            {/* Metadata */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata || false}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeMetadata: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include metadata
                </span>
              </label>
            </div>

            {/* Metadata fields */}
            {exportOptions.includeMetadata && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200 dark:border-gray-600">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={exportOptions.pageTitle || ""}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        pageTitle: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Design Export"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={exportOptions.author || ""}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        author: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Design Studio"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={exportOptions.subject || ""}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Generated Design"
                  />
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => handleExportAllPages("jspdf")}
                disabled={
                  isExporting ||
                  !currentPage ||
                  currentPage.elements.length === 0
                }
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export Using jsPDF</span>
              </button>

              <button
                onClick={() => handleExportAllPages("pdf-lib")}
                disabled={isExporting}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export Using pdf-lib</span>
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowOptions(false)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Status Messages */}
      {exportStatus === "error" && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300">
          Export failed. Please try again.
        </div>
      )}
    </div>
  );
};

export default PDFExportButton;
