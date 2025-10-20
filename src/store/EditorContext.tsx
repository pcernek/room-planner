import { createContext, useContext, useState, ReactNode } from 'react';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../constants';

interface IEditorState {
  canvasDimensions: { width: number; height: number };
}

interface IEditorContextValue {
  state: IEditorState;
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
}

const EditorContext = createContext<IEditorContextValue | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  return (
    <EditorContext.Provider
      value={{
        state: { canvasDimensions },
        setCanvasDimensions,
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

