import React from 'react';
import { useRoom } from '../store/RoomContext';
import { WallPropertiesPanel } from './properties/WallPropertiesPanel';
import { DoorPropertiesPanel } from './properties/DoorPropertiesPanel';
import { FurniturePropertiesPanel } from './properties/FurniturePropertiesPanel';
import { WallSequencePropertiesPanel } from './properties/WallSequencePropertiesPanel';

export function PropertiesFloatingCard() {
  const { state, dispatch } = useRoom();

  function handleDeleteSelected() {
    if (!state.selectedEntityId || !state.selectedEntityType) return;

    switch (state.selectedEntityType) {
      case 'wall':
        dispatch({ type: 'DELETE_WALL', payload: state.selectedEntityId });
        break;
      case 'door':
        dispatch({ type: 'DELETE_DOOR', payload: state.selectedEntityId });
        break;
      case 'furniture':
        dispatch({ type: 'DELETE_FURNITURE', payload: state.selectedEntityId });
        break;
    }
    dispatch({ type: 'SET_SELECTED_ENTITY', payload: { id: null, entityType: null } });
  }

  function handleUpdateWall(id: string, updates: { length?: number; angle?: number }) {
    dispatch({
      type: 'UPDATE_WALL',
      payload: { id, updates },
    });
  }

  function handleUpdateDoor(id: string, updates: { offsetFromStart?: number; width?: number }) {
    dispatch({
      type: 'UPDATE_DOOR',
      payload: { id, updates },
    });
  }

  function handleUpdateFurniture(
    id: string,
    updates: { name?: string; width?: number; height?: number; rotation?: number }
  ) {
    dispatch({
      type: 'UPDATE_FURNITURE',
      payload: { id, updates },
    });
  }

  function renderSelectedEntityPanel() {
    if (!state.room) {
      return null;
    }

    if (!state.selectedEntityId || !state.selectedEntityType) {
      return null;
    }

    if (state.selectedEntityType === 'wallSequence') {
      const sequence = state.room.wallSequences.find((s) => s.id === state.selectedEntityId);
      if (!sequence) return null;

      return <WallSequencePropertiesPanel sequence={sequence} />;
    }

    if (state.selectedEntityType === 'wall') {
      let wall = null;
      for (const sequence of state.room.wallSequences) {
        wall = sequence.walls.find((w) => w.id === state.selectedEntityId);
        if (wall) break;
      }
      if (!wall) return null;

      const isStandalone =
        state.room.wallSequences.length === 1 && state.room.wallSequences[0].walls.length === 1;

      return (
        <WallPropertiesPanel
          wall={wall}
          unit={state.room.unit}
          isStandalone={isStandalone}
          onUpdate={handleUpdateWall}
          onDelete={handleDeleteSelected}
        />
      );
    }

    if (state.selectedEntityType === 'door') {
      const door = state.room.doors.find((d) => d.id === state.selectedEntityId);
      if (!door) return null;

      return (
        <DoorPropertiesPanel
          door={door}
          unit={state.room.unit}
          onUpdate={handleUpdateDoor}
          onDelete={handleDeleteSelected}
        />
      );
    }

    if (state.selectedEntityType === 'furniture') {
      const furniture = state.room.furniture.find((f) => f.id === state.selectedEntityId);
      if (!furniture) return null;

      return (
        <FurniturePropertiesPanel
          furniture={furniture}
          unit={state.room.unit}
          onUpdate={handleUpdateFurniture}
          onDelete={handleDeleteSelected}
        />
      );
    }

    return null;
  }

  const panel = renderSelectedEntityPanel();

  if (!panel) {
    return null;
  }

  return <div style={styles.floatingCard}>{panel}</div>;
}

const styles: Record<string, React.CSSProperties> = {
  floatingCard: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '20px',
    minWidth: '280px',
    maxWidth: '320px',
    zIndex: 1000,
    pointerEvents: 'auto',
  },
};
