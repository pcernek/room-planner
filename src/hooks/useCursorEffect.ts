import { useEffect } from 'react';
import { useHover } from '../store/HoverContext';
import { useEditor } from '../store/EditorContext';

export function useCursorEffect(stageContainer: HTMLDivElement | null) {
  const { hoverState } = useHover();
  const { state: editorState } = useEditor();

  useEffect(() => {
    if (!stageContainer) return;

    if (editorState.activeTool === 'placeFurniture' || editorState.activeTool === 'placeWall') {
      stageContainer.style.cursor = 'crosshair';
      return;
    }

    if (hoverState.entityType === 'furniture') {
      stageContainer.style.cursor = hoverState.isSelected ? 'grab' : 'pointer';
    } else if (
      hoverState.entityType === 'wall' ||
      hoverState.entityType === 'door' ||
      hoverState.entityType === 'endpoint' ||
      hoverState.entityType === 'newWallButton'
    ) {
      stageContainer.style.cursor = 'pointer';
    } else {
      stageContainer.style.cursor = 'move';
    }
  }, [hoverState, editorState.activeTool, stageContainer]);
}
