import { createContext, useContext, useState, ReactNode } from 'react';
import { IViewport } from '../types';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../constants';

interface IEditorState {
  canvasDimensions: { width: number; height: number };
  viewport: IViewport;
}

interface IEditorContextValue {
  state: IEditorState;
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  setViewport: (viewport: Partial<IViewport>) => void;
}

const EditorContext = createContext<IEditorContextValue | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  const [viewport, setViewportState] = useState<IViewport>({
    offsetX: 400,
    offsetY: 400,
    scale: 1,
  });

  const setViewport = (updates: Partial<IViewport>) => {
    setViewportState(prev => ({ ...prev, ...updates }));
  };

  return (
    <EditorContext.Provider
      value={{
        state: { canvasDimensions, viewport },
        setCanvasDimensions,
        setViewport,
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

