import React from 'react';
import { useRoom } from '../store/RoomContext';
import { useEditor } from '../store/EditorContext';
import { WallPropertiesPanel } from './properties/WallPropertiesPanel';
import { DoorPropertiesPanel } from './properties/DoorPropertiesPanel';
import { FurniturePropertiesPanel } from './properties/FurniturePropertiesPanel';
import { WallSequencePropertiesPanel } from './properties/WallSequencePropertiesPanel';

export function Sidebar() {
  const { state, dispatch } = useRoom();
  const { state: editorState, setActiveTool } = useEditor();

  if (!state.room) {
    return (
      <div style={styles.sidebar}>
        <h2 style={styles.title}>Room Planner</h2>
        <div style={styles.noSelection}>Create a room to start planning</div>
      </div>
    );
  }

  const activeTool = editorState.activeTool;

  function handleToolToggle(tool: 'placeWall' | 'placeDoor' | 'placeFurniture') {
    if (activeTool === tool) {
      setActiveTool('select');
    } else {
      setActiveTool(tool);
    }
  }

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
      return <div style={styles.noSelection}>No entity selected</div>;
    }

    if (!state.selectedEntityId || !state.selectedEntityType) {
      return <div style={styles.noSelection}>No entity selected</div>;
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

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>Room Planner</h2>

      <div style={styles.section}>
        <button
          onClick={() => handleToolToggle('placeWall')}
          style={activeTool === 'placeWall' ? styles.buttonActive : styles.button}
        >
          Add Wall
        </button>
        {activeTool === 'placeWall' && (
          <p style={styles.hint}>Click on canvas to place a new wall</p>
        )}
      </div>

      <div style={styles.section}>
        <button
          onClick={() => handleToolToggle('placeDoor')}
          style={activeTool === 'placeDoor' ? styles.buttonActive : styles.button}
        >
          Add Door
        </button>
        {activeTool === 'placeDoor' && (
          <p style={styles.hint}>Click on a wall to add a door to it</p>
        )}
      </div>

      <div style={styles.section}>
        <button
          onClick={() => handleToolToggle('placeFurniture')}
          style={activeTool === 'placeFurniture' ? styles.buttonActive : styles.button}
        >
          Add Furniture
        </button>
        {activeTool === 'placeFurniture' && (
          <p style={styles.hint}>Click on canvas to draw furniture bounding box</p>
        )}
      </div>

      <div style={styles.section}>{renderSelectedEntityPanel()}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '300px',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    borderRight: '1px solid #ddd',
    padding: '20px',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '24px',
    fontWeight: 'normal',
    color: '#333',
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #ddd',
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#666',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4A90E2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  buttonActive: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2E5F8E',
    color: '#fff',
    border: '2px solid #1E3A5F',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  hint: {
    margin: '10px 0 10px 0',
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  noSelection: {
    padding: '15px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
};
