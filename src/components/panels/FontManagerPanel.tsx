import React, { useState, useRef } from 'react';
import { Upload, Type, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useDesign } from '../../context/DesignContext';

const FontManagerPanel: React.FC = () => {
  const { state, addCustomFont, removeCustomFont } = useDesign();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['.woff', '.woff2', '.ttf', '.otf'];

  const handleFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported font format. Please use: ${supportedFormats.join(', ')}`);
      }

      // Create object URL for the font file
      const fontUrl = URL.createObjectURL(file);
      
      // Extract font name from filename
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const fontFamily = `Custom-${fontName.replace(/\s+/g, '')}`;

      // Determine format for CSS
      let format = 'truetype';
      if (fileExtension === '.woff') format = 'woff';
      else if (fileExtension === '.woff2') format = 'woff2';
      else if (fileExtension === '.otf') format = 'opentype';

      await addCustomFont({
        name: fontName,
        family: fontFamily,
        url: fontUrl,
        format: format,
      });

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload font');
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveFont = (fontId: string) => {
    if (confirm('Are you sure you want to remove this font?')) {
      removeCustomFont(fontId);
    }
  };

  const webSafeFonts = [
    { name: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Helvetica', family: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', family: 'Times New Roman, serif' },
    { name: 'Georgia', family: 'Georgia, serif' },
    { name: 'Verdana', family: 'Verdana, sans-serif' },
    { name: 'Courier New', family: 'Courier New, monospace' },
    { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif' },
    { name: 'Impact', family: 'Impact, sans-serif' },
    { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive' },
    { name: 'Palatino', family: 'Palatino, serif' },
  ];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Upload Custom Fonts
        </h3>
        
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors"
        >
          <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click to upload font files
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Supports: {supportedFormats.join(', ')}
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(',')}
          onChange={handleFontUpload}
          className="hidden"
          disabled={isUploading}
        />

        {/* Upload Status */}
        {isUploading && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">Uploading font...</span>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{uploadError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Fonts */}
      {state.customFonts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Custom Fonts
          </h3>
          
          <div className="space-y-2">
            {state.customFonts.map((font) => (
              <div
                key={font.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <Type className="h-4 w-4 text-gray-500" />
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900 dark:text-white"
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {font.family}
                    </p>
                  </div>
                  {font.loaded && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                
                <button
                  onClick={() => handleRemoveFont(font.id)}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Remove Font"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Web Safe Fonts */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Web Safe Fonts
        </h3>
        
        <div className="space-y-1">
          {webSafeFonts.map((font) => (
            <div
              key={font.family}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
            >
              <p 
                className="text-sm text-gray-900 dark:text-white"
                style={{ fontFamily: font.family }}
              >
                {font.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {font.family}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Font Usage Tips */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Font Usage Tips:
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
          <li>• WOFF2 format provides the best compression and performance</li>
          <li>• Custom fonts will be embedded in PDF exports</li>
          <li>• Font files are stored locally in your browser</li>
          <li>• Use web-safe fonts as fallbacks for better compatibility</li>
          <li>• Large font files may affect application performance</li>
        </ul>
      </div>
    </div>
  );
};

export default FontManagerPanel;