import Konva from 'konva';
import { useRoom } from '../store/RoomContext';

interface IEntitySelectionResult {
  selectWall: (wallId: string) => void;
  selectDoor: (doorId: string) => void;
  selectFurniture: (furnitureId: string) => void;
  clearSelection: () => void;
  handleWallClick: (wallId: string, e: Konva.KonvaEventObject<MouseEvent>, isDragging: boolean) => void;
}

export function useEntitySelection(): IEntitySelectionResult {
  const { dispatch } = useRoom();

  function selectWall(wallId: string) {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: wallId, entityType: 'wall' },
    });
  }

  function selectDoor(doorId: string) {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: doorId, entityType: 'door' },
    });
  }

  function selectFurniture(furnitureId: string) {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: furnitureId, entityType: 'furniture' },
    });
  }

  function clearSelection() {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: null, entityType: null },
    });
  }

  function handleWallClick(wallId: string, e: Konva.KonvaEventObject<MouseEvent>, isDragging: boolean) {
    e.cancelBubble = true;
    if (!isDragging) {
      selectWall(wallId);
    }
  }

  return {
    selectWall,
    selectDoor,
    selectFurniture,
    clearSelection,
    handleWallClick,
  };
}

