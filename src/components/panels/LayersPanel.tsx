import React, { useRef, useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical,
  Copy,
  Trash2
} from 'lucide-react';
import { useDesign } from '../../context/DesignContext';

const LayersPanel: React.FC = () => {
  const { 
    state, 
    selectElement, 
    updateElement, 
    deleteElement, 
    duplicateElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward
  } = useDesign();

  const currentPage = state.pages.find(p => p.id === state.currentPageId);
  if (!currentPage) return null;

  // Sort elements by z-index (highest first)
  const sortedElements = [...currentPage.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'image':
        return '🖼️';
      case 'shape':
        return '🔷';
      case 'line':
        return '📏';
      default:
        return '📄';
    }
  };

  const getElementName = (element: any) => {
    if (element.type === 'text' && element.content) {
      return element.content.substring(0, 20) + (element.content.length > 20 ? '...' : '');
    }
    return `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} ${element.id.split('-')[1]}`;
  };

  const toggleVisibility = (elementId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'hidden' ? 'visible' : 'hidden';
    updateElement(elementId, {
      styles: {
        ...currentPage.elements.find(el => el.id === elementId)?.styles,
        visibility: newVisibility
      }
    });
  };

  const toggleLock = (elementId: string, currentPointerEvents: string) => {
    const newPointerEvents = currentPointerEvents === 'none' ? 'auto' : 'none';
    updateElement(elementId, {
      styles: {
        ...currentPage.elements.find(el => el.id === elementId)?.styles,
        pointerEvents: newPointerEvents
      }
    });
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close menu on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId]?.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenuId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Layers
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {sortedElements.length} elements
        </span>
      </div>

      {sortedElements.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No elements on this page</p>
          <p className="text-xs mt-1">Add elements from the Elements panel</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {sortedElements.map((element) => {
            const isSelected = state.selectedElementIds?.includes(element.id);
            const isVisible = element.styles.visibility !== 'hidden';
            const isLocked = element.styles.pointerEvents === 'none';

            return (
              <div
                key={element.id}
                className={`group flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => selectElement(element.id)}
              >
                {/* Element Icon & Name */}
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-sm">{getElementIcon(element.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getElementName(element)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      z-index: {element.zIndex || 0}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-1 transition-opacity">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(element.id, element.styles.visibility || 'visible');
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title={isVisible ? 'Hide' : 'Show'}
                  >
                    {isVisible ? (
                      <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(element.id, element.styles.pointerEvents || 'auto');
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title={isLocked ? 'Unlock' : 'Lock'}
                  >
                    {isLocked ? (
                      <Lock className="h-3 w-3 text-red-500" />
                    ) : (
                      <Unlock className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>

                  {/* Layer Order Controls */}
                  <div className="flex flex-col">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        bringForward(element.id);
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Bring Forward"
                    >
                      <ChevronUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendBackward(element.id);
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Send Backward"
                    >
                      <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* More Actions */}
                  <div
                    className="relative"
                    ref={el => (menuRefs.current[element.id] = el)}
                  >
                    <button
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      onClick={e => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === element.id ? null : element.id);
                      }}
                    >
                      <MoreVertical className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </button>
                    {openMenuId === element.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            duplicateElement(element.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            bringToFront(element.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <ChevronUp className="h-3 w-3" />
                          <span>To Front</span>
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            sendToBack(element.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <ChevronDown className="h-3 w-3" />
                          <span>To Back</span>
                        </button>
                        <hr className="border-gray-200 dark:border-gray-600" />
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            deleteElement(element.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Layer Management Tips */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          💡 Layer Tips:
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Higher z-index elements appear on top</li>
          <li>• Click eye icon to hide/show elements</li>
          <li>• Lock elements to prevent accidental edits</li>
          <li>• Use arrows to adjust layer order</li>
        </ul>
      </div>
    </div>
  );
};

export default LayersPanel;