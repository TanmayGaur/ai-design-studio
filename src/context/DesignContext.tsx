import React, { createContext, useContext, useState, useCallback } from 'react';

export interface PageSettings {
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'in';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  backgroundColor: string;
  backgroundImage?: string;
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'line';
  x: number; // Always stored in mm
  y: number; // Always stored in mm
  width: number; // Always stored in mm
  height: number; // Always stored in mm
  rotation?: number; // Degrees (0-360)
  zIndex: number; // Stacking order
  content?: string;
  styles: {
    // Layout & Positioning
    position?: string;
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    transform?: string;
    transformOrigin?: string;
    
    // Dimensions
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
    
    // Display & Visibility
    display?: string;
    visibility?: string;
    opacity?: number;
    overflow?: string;
    
    // Background
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
    backgroundClip?: string;
    backgroundOrigin?: string;
    
    // Border
    border?: string;
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: string;
    borderTop?: string;
    borderRight?: string;
    borderBottom?: string;
    borderLeft?: string;
    
    // Text
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    fontVariant?: string;
    lineHeight?: string;
    letterSpacing?: string;
    wordSpacing?: string;
    textAlign?: string;
    textDecoration?: string;
    textTransform?: string;
    textShadow?: string;
    textIndent?: string;
    whiteSpace?: string;
    wordWrap?: string;
    wordBreak?: string;
    
    // Flexbox
    alignItems?: string;
    justifyContent?: string;
    flexDirection?: string;
    flexWrap?: string;
    alignContent?: string;
    alignSelf?: string;
    justifySelf?: string;
    flex?: string;
    flexGrow?: string;
    flexShrink?: string;
    flexBasis?: string;
    
    // Spacing
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    
    // Image specific
    objectFit?: 'cover' | 'contain' | 'fill' ;
    objectPosition?: string;
    
    // Cursor
    cursor?: string;
    pointerEvents?: string;
    
    // Custom properties
    [key: string]: any;
  };
}

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  url: string;
  format: string;
  loaded: boolean;
}

export interface DesignState {
  pages: Array<{
    id: string;
    settings: PageSettings;
    elements: DesignElement[];
  }>;
  currentPageId: string;
  selectedElementId?: string;
  selectedElementIds?: string[]; // Multi-selection
  zoom?: number;
  showGrid?: boolean;
  showRulers?: boolean;
  showGuides?: boolean;
  gridSize?: number;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  customFonts: CustomFont[];
  clipboard: DesignElement[];
}

export interface HistoryState {
  past: DesignState[];
  present: DesignState;
  future: DesignState[];
}

interface DesignContextType {
  state: DesignState;
  history: HistoryState;
  updatePageSettings: (pageId: string, settings: Partial<PageSettings>) => void;
  addElement: (element: Omit<DesignElement, 'id' | 'zIndex'>) => void;
  addElements: (elements: Array<Omit<DesignElement, 'id' | 'zIndex'>>) => void;
  updateElement: (elementId: string, updates: Partial<DesignElement>) => void;
  updateElements: (elementIds: string[], updates: Partial<DesignElement>) => void;
  deleteElement: (elementId: string) => void;
  deleteElements: (elementIds: string[]) => void;
  duplicateElement: (elementId: string) => void;
  selectElement: (elementId?: string, multiSelect?: boolean) => void;
  selectElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  bringToFront: (elementId: string) => void;
  sendToBack: (elementId: string) => void;
  bringForward: (elementId: string) => void;
  sendBackward: (elementId: string) => void;
  groupElements: (elementIds: string[]) => void;
  ungroupElements: (groupId: string) => void;
  copyElements: (elementIds: string[]) => void;
  pasteElements: () => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  setGridSize: (size: number) => void;
  setViewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  addPage: () => void;
  deletePage: (pageId: string) => void;
  setCurrentPage: (pageId: string) => void;
  addCustomFont: (font: Omit<CustomFont, 'id' | 'loaded'>) => Promise<void>;
  removeCustomFont: (fontId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const defaultPageSettings: PageSettings = {
  width: 210, // A4 width in mm
  height: 297, // A4 height in mm
  unit: 'mm',
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 }, // in mm
  backgroundColor: '#ffffff',
};

const defaultPage = {
  id: 'page-1',
  settings: defaultPageSettings,
  elements: [],
};

const initialState: DesignState = {
  pages: [defaultPage],
  currentPageId: 'page-1',
  selectedElementIds: [],
  zoom: 100,
  showGrid: false,
  showRulers: true,
  showGuides: false,
  gridSize: 10,
  viewMode: 'desktop',
  customFonts: [],
  clipboard: [],
};

const initialHistory: HistoryState = {
  past: [],
  present: initialState,
  future: [],
};

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const DesignProvider: React.FC<{ 
  children: React.ReactNode | ((props: { state: DesignState; onStateChange: (state: DesignState) => void }) => React.ReactNode);
}> = ({ children }) => {
  const [history, setHistory] = useState<HistoryState>(initialHistory);

  const pushToHistory = useCallback((newState: DesignState) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newState,
      future: [],
    }));
  }, []);

  const onStateChange = useCallback((newState: DesignState) => {
    setHistory(prev => ({
      ...prev,
      present: newState,
    }));
  }, []);

  const getNextZIndex = useCallback(() => {
    const currentPage = history.present.pages.find(p => p.id === history.present.currentPageId);
    if (!currentPage) return 1;
    
    const maxZ = Math.max(0, ...currentPage.elements.map(el => el.zIndex || 0));
    return maxZ + 1;
  }, [history.present]);

  const updatePageSettings = useCallback((pageId: string, settings: Partial<PageSettings>) => {
    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === pageId
          ? { ...page, settings: { ...page.settings, ...settings } }
          : page
      ),
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory]);

  const addElement = useCallback((element: Omit<DesignElement, 'id' | 'zIndex'>) => {
    // Convert pixel values to mm for storage
    const pxToMm = (px: number): number => (px * 25.4) / 96;
    
    const newElement: DesignElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      zIndex: getNextZIndex(),
      // Convert default pixel values to mm
      x: element.x ? pxToMm(element.x) : pxToMm(50),
      y: element.y ? pxToMm(element.y) : pxToMm(50),
      width: element.width ? pxToMm(element.width) : pxToMm(element.type === 'text' ? 200 : 100),
      height: element.height ? pxToMm(element.height) : pxToMm(element.type === 'text' ? 40 : 100),
      rotation: element.rotation || 0,
      styles: {
        position: 'absolute',
        display: element.type === 'text' ? 'flex' : 'block',
        alignItems: element.type === 'text' ? 'center' : undefined,
        justifyContent: element.type === 'text' ? 'flex-start' : undefined,
        ...element.styles,
      },
    };

    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? { ...page, elements: [...page.elements, newElement] }
          : page
      ),
      selectedElementIds: [newElement.id],
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory, getNextZIndex]);

  const addElements = useCallback((elements: Array<Omit<DesignElement, 'id' | 'zIndex'>>) => {
    // Convert pixel values to mm for storage
    const pxToMm = (px: number): number => px;
    
    const newElements: DesignElement[] = elements.map(element => ({
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      zIndex: getNextZIndex(),
      // Convert default pixel values to mm
      x: element.x ? pxToMm(element.x) : pxToMm(50),
      y: element.y ? pxToMm(element.y) : pxToMm(50),
      width: element.width ? pxToMm(element.width) : pxToMm(element.type === 'text' ? 200 : 100),
      height: element.height ? pxToMm(element.height) : pxToMm(element.type === 'text' ? 40 : 100),
      rotation: element.rotation || 0,
      styles: {
        position: 'absolute',
        display: element.type === 'text' ? 'flex' : 'block',
        alignItems: element.type === 'text' ? 'center' : undefined,
        justifyContent: element.type === 'text' ? 'flex-start' : undefined,
        ...element.styles,
      },
    }));

    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? { ...page, elements: [...page.elements, ...newElements] }
          : page
      ),
      selectedElementIds: newElements.map(el => el.id),
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory, getNextZIndex]);

  const updateElement = useCallback((elementId: string, updates: Partial<DesignElement>) => {
    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === elementId ? { ...el, ...updates } : el
              ),
            }
          : page
      ),
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory]);

  const updateElements = useCallback((elementIds: string[], updates: Partial<DesignElement>) => {
    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? {
              ...page,
              elements: page.elements.map(el =>
                elementIds.includes(el.id) ? { ...el, ...updates } : el
              ),
            }
          : page
      ),
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory]);

  const deleteElement = useCallback((elementId: string) => {
    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? { ...page, elements: page.elements.filter(el => el.id !== elementId) }
          : page
      ),
      selectedElementIds: history.present.selectedElementIds?.filter(id => id !== elementId),
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory]);

  const deleteElements = useCallback((elementIds: string[]) => {
    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? { ...page, elements: page.elements.filter(el => !elementIds.includes(el.id)) }
          : page
      ),
      selectedElementIds: history.present.selectedElementIds?.filter(id => !elementIds.includes(id)),
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory]);

  const duplicateElement = useCallback((elementId: string) => {
    const currentPage = history.present.pages.find(p => p.id === history.present.currentPageId);
    const element = currentPage?.elements.find(el => el.id === elementId);
    
    if (!element) return;

    const duplicatedElement: DesignElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 10, // Offset by 10mm
      y: element.y + 10,
      zIndex: getNextZIndex(),
    };

    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? { ...page, elements: [...page.elements, duplicatedElement] }
          : page
      ),
      selectedElementIds: [duplicatedElement.id],
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory, getNextZIndex]);

  const selectElement = useCallback((elementId?: string, multiSelect = false) => {
    if (!elementId) {
      setHistory(prev => ({
        ...prev,
        present: { ...prev.present, selectedElementIds: [] },
      }));
      return;
    }

    setHistory(prev => {
      let newSelection: string[];
      
      if (multiSelect) {
        const currentSelection = prev.present.selectedElementIds || [];
        if (currentSelection.includes(elementId)) {
          newSelection = currentSelection.filter(id => id !== elementId);
        } else {
          newSelection = [...currentSelection, elementId];
        }
      } else {
        newSelection = [elementId];
      }

      return {
        ...prev,
        present: { ...prev.present, selectedElementIds: newSelection },
      };
    });
  }, []);

  const selectElements = useCallback((elementIds: string[]) => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, selectedElementIds: elementIds },
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, selectedElementIds: [] },
    }));
  }, []);

  const bringToFront = useCallback((elementId: string) => {
    const maxZ = getNextZIndex();
    updateElement(elementId, { zIndex: maxZ });
  }, [updateElement, getNextZIndex]);

  const sendToBack = useCallback((elementId: string) => {
    updateElement(elementId, { zIndex: 0 });
    
    // Adjust other elements' z-index
    const currentPage = history.present.pages.find(p => p.id === history.present.currentPageId);
    if (currentPage) {
      currentPage.elements.forEach((el, index) => {
        if (el.id !== elementId) {
          updateElement(el.id, { zIndex: index + 1 });
        }
      });
    }
  }, [updateElement, history.present]);

  const bringForward = useCallback((elementId: string) => {
    const currentPage = history.present.pages.find(p => p.id === history.present.currentPageId);
    const element = currentPage?.elements.find(el => el.id === elementId);
    
    if (element) {
      updateElement(elementId, { zIndex: (element.zIndex || 0) + 1 });
    }
  }, [updateElement, history.present]);

  const sendBackward = useCallback((elementId: string) => {
    const currentPage = history.present.pages.find(p => p.id === history.present.currentPageId);
    const element = currentPage?.elements.find(el => el.id === elementId);
    
    if (element && (element.zIndex || 0) > 0) {
      updateElement(elementId, { zIndex: (element.zIndex || 0) - 1 });
    }
  }, [updateElement, history.present]);

  const groupElements = useCallback((elementIds: string[]) => {
    // Implementation for grouping elements
    console.log('Group elements:', elementIds);
  }, []);

  const ungroupElements = useCallback((groupId: string) => {
    // Implementation for ungrouping elements
    console.log('Ungroup elements:', groupId);
  }, []);

  const copyElements = useCallback((elementIds: string[]) => {
    const currentPage = history.present.pages.find(p => p.id === history.present.currentPageId);
    if (!currentPage) return;

    const elementsToCopy = currentPage.elements.filter(el => elementIds.includes(el.id));
    
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, clipboard: elementsToCopy },
    }));
  }, [history.present]);

  const pasteElements = useCallback(() => {
    if (history.present.clipboard.length === 0) return;

    const newElements = history.present.clipboard.map(element => ({
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 10, // Offset
      y: element.y + 10,
      zIndex: getNextZIndex(),
    }));

    const newState = {
      ...history.present,
      pages: history.present.pages.map(page =>
        page.id === history.present.currentPageId
          ? { ...page, elements: [...page.elements, ...newElements] }
          : page
      ),
      selectedElementIds: newElements.map(el => el.id),
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory, getNextZIndex]);

  const setZoom = useCallback((zoom: number) => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, zoom },
    }));
  }, []);

  const toggleGrid = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, showGrid: !prev.present.showGrid },
    }));
  }, []);

  const toggleRulers = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, showRulers: !prev.present.showRulers },
    }));
  }, []);

  const toggleGuides = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, showGuides: !prev.present.showGuides },
    }));
  }, []);

  const setGridSize = useCallback((size: number) => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, gridSize: size },
    }));
  }, []);

  const setViewMode = useCallback((mode: 'desktop' | 'tablet' | 'mobile') => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, viewMode: mode },
    }));
  }, []);

  const addPage = useCallback(() => {
    const newPageId = `page-${Date.now()}`;
    const newPage = {
      id: newPageId,
      settings: { ...defaultPageSettings },
      elements: [],
    };

    const newState = {
      ...history.present,
      pages: [...history.present.pages, newPage],
      currentPageId: newPageId,
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory]);

  const deletePage = useCallback((pageId: string) => {
    if (history.present.pages.length <= 1) return;

    const newPages = history.present.pages.filter(p => p.id !== pageId);
    const newCurrentPageId = history.present.currentPageId === pageId
      ? newPages[0].id
      : history.present.currentPageId;

    const newState = {
      ...history.present,
      pages: newPages,
      currentPageId: newCurrentPageId,
    };
    pushToHistory(newState);
  }, [history.present, pushToHistory]);

  const setCurrentPage = useCallback((pageId: string) => {
    setHistory(prev => ({
      ...prev,
      present: { ...prev.present, currentPageId: pageId, selectedElementIds: [] },
    }));
  }, []);

  const addCustomFont = useCallback(async (font: Omit<CustomFont, 'id' | 'loaded'>) => {
    const fontId = `font-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create font face
      const fontFace = new FontFace(font.family, `url(${font.url})`, {
        style: 'normal',
        weight: 'normal',
      });
      
      // Load the font
      await fontFace.load();
      
      // Add to document
      document.fonts.add(fontFace);
      
      const newFont: CustomFont = {
        ...font,
        id: fontId,
        loaded: true,
      };

      setHistory(prev => ({
        ...prev,
        present: {
          ...prev.present,
          customFonts: [...prev.present.customFonts, newFont],
        },
      }));
    } catch (error) {
      console.error('Failed to load font:', error);
      throw new Error('Failed to load font');
    }
  }, []);

  const removeCustomFont = useCallback((fontId: string) => {
    setHistory(prev => ({
      ...prev,
      present: {
        ...prev.present,
        customFonts: prev.present.customFonts.filter(font => font.id !== fontId),
      },
    }));
  }, []);

  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    
    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      present: prev.past[prev.past.length - 1],
      future: [prev.present, ...prev.future],
    }));
  }, [history.past]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: prev.future[0],
      future: prev.future.slice(1),
    }));
  }, [history.future]);

  const value: DesignContextType = {
    state: history.present,
    history,
    updatePageSettings,
    addElement,
    addElements,
    updateElement,
    updateElements,
    deleteElement,
    deleteElements,
    duplicateElement,
    selectElement,
    selectElements,
    clearSelection,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupElements,
    ungroupElements,
    copyElements,
    pasteElements,
    setZoom,
    toggleGrid,
    toggleRulers,
    toggleGuides,
    setGridSize,
    setViewMode,
    addPage,
    deletePage,
    setCurrentPage,
    addCustomFont,
    removeCustomFont,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };

  if (typeof children === 'function') {
    return (
      <DesignContext.Provider value={value}>
        {children({ state: history.present, onStateChange })}
      </DesignContext.Provider>
    );
  }

  return (
    <DesignContext.Provider value={value}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesign = () => {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error('useDesign must be used within DesignProvider');
  }
  return context;
};