import Konva from 'konva';
import { useRoom } from '../store/RoomContext';

interface IEntitySelectionResult {
  selectWall: (wallId: string) => void;
  selectDoor: (doorId: string) => void;
  selectFurniture: (furnitureId: string) => void;
  selectWallSequence: (sequenceId: string) => void;
  clearSelection: () => void;
  handleWallClick: (
    wallId: string,
    e: Konva.KonvaEventObject<MouseEvent>,
    isDragging: boolean
  ) => void;
}

export function useEntitySelection(): IEntitySelectionResult {
  const { state, dispatch } = useRoom();

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

  function selectWallSequence(sequenceId: string) {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: sequenceId, entityType: 'wallSequence' },
    });
  }

  function clearSelection() {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: null, entityType: null },
    });
  }

  function handleWallClick(
    wallId: string,
    e: Konva.KonvaEventObject<MouseEvent>,
    isDragging: boolean
  ) {
    e.cancelBubble = true;
    if (!isDragging) {
      if (state.selectedEntityId === wallId && state.selectedEntityType === 'wall') {
        if (state.room) {
          for (const sequence of state.room.wallSequences) {
            if (sequence.walls.some((wall) => wall.id === wallId)) {
              selectWallSequence(sequence.id);
              return;
            }
          }
        }
      } else {
        selectWall(wallId);
      }
    }
  }

  return {
    selectWall,
    selectDoor,
    selectFurniture,
    selectWallSequence,
    clearSelection,
    handleWallClick,
  };
}
