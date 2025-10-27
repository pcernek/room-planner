import React from 'react';
import { useRoom } from '../store/RoomContext';
import { useEditor } from '../store/EditorContext';

export function Sidebar() {
  const { state } = useRoom();
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
};
