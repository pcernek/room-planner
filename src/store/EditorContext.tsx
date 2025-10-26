import { createContext, useContext, useState, ReactNode } from 'react';
import { IViewport, Tool } from '../types';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface IEditorState {
  canvasDimensions: { width: number; height: number };
  viewport: IViewport;
  activeTool: Tool;
}

interface IEditorContextValue {
  state: IEditorState;
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  setViewport: (viewport: Partial<IViewport>) => void;
  setActiveTool: (tool: Tool) => void;
}

const EditorContext = createContext<IEditorContextValue | undefined>(undefined);

const DEFAULT_VIEWPORT: IViewport = {
  offsetX: 400,
  offsetY: 400,
  scale: 1,
};

export function EditorProvider({ children }: { children: ReactNode }) {
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  const [viewport, setViewportState] = useLocalStorage<IViewport>(
    'room-planner-viewport',
    DEFAULT_VIEWPORT
  );
  const [activeTool, setActiveTool] = useState<Tool>('select');

  const setViewport = (updates: Partial<IViewport>) => {
    setViewportState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <EditorContext.Provider
      value={{
        state: { canvasDimensions, viewport, activeTool },
        setCanvasDimensions,
        setViewport,
        setActiveTool,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
