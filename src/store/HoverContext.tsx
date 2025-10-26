import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type HoverEntityType = 'furniture' | 'wall' | 'door' | 'endpoint' | 'newWallButton' | null;

interface IHoverState {
  entityType: HoverEntityType;
  entityId: string | null;
  isSelected?: boolean;
}

interface IHoverContextValue {
  hoverState: IHoverState;
  setHover: (entityType: HoverEntityType, entityId: string | null, isSelected?: boolean) => void;
  clearHover: () => void;
}

const HoverContext = createContext<IHoverContextValue | undefined>(undefined);

const DEFAULT_HOVER_STATE: IHoverState = {
  entityType: null,
  entityId: null,
  isSelected: false,
};

export function HoverProvider({ children }: { children: ReactNode }) {
  const [hoverState, setHoverState] = useState<IHoverState>(DEFAULT_HOVER_STATE);

  const setHover = useCallback(
    (entityType: HoverEntityType, entityId: string | null, isSelected?: boolean) => {
      setHoverState({
        entityType,
        entityId,
        isSelected,
      });
    },
    []
  );

  const clearHover = useCallback(() => {
    setHoverState(DEFAULT_HOVER_STATE);
  }, []);

  return (
    <HoverContext.Provider value={{ hoverState, setHover, clearHover }}>
      {children}
    </HoverContext.Provider>
  );
}

export function useHover() {
  const context = useContext(HoverContext);
  if (!context) {
    throw new Error('useHover must be used within HoverProvider');
  }
  return context;
}
