import React, { useRef } from 'react';
import { useRoom } from '../store/RoomContext';
import { IRoom } from '../types';

export function Toolbar() {
  const { state, dispatch } = useRoom();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const dataStr = JSON.stringify(state.room, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `room-plan-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        if (!validateRoom(jsonData)) {
          alert('Invalid room plan file');
          return;
        }

        dispatch({ type: 'SET_ROOM', payload: jsonData });
        alert('Room plan imported successfully');
      } catch (error) {
        alert('Failed to import room plan: Invalid JSON');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function validateRoom(data: IRoom): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.walls)) return false;
    if (!Array.isArray(data.doors)) return false;
    if (!Array.isArray(data.furniture)) return false;
    return true;
  }

  function handleZoomIn() {
    dispatch({
      type: 'SET_VIEWPORT',
      payload: { scale: Math.min(5, state.viewport.scale * 1.2) },
    });
  }

  function handleZoomOut() {
    dispatch({
      type: 'SET_VIEWPORT',
      payload: { scale: Math.max(0.1, state.viewport.scale / 1.2) },
    });
  }

  function handleResetView() {
    dispatch({
      type: 'SET_VIEWPORT',
      payload: { offsetX: 400, offsetY: 400, scale: 1 },
    });
  }

  return (
    <div style={styles.toolbar}>
      <div style={styles.leftSection}>
        <button onClick={handleImport} style={styles.button}>
          Import JSON
        </button>
        <button onClick={handleExport} style={styles.button}>
          Export JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={styles.centerSection}>
        <span style={styles.stats}>
          Walls: {state.room.walls.length} | Doors: {state.room.doors.length} | Furniture: {state.room.furniture.length}
        </span>
      </div>

      <div style={styles.rightSection}>
        <button onClick={handleZoomOut} style={styles.button}>
          −
        </button>
        <span style={styles.zoomDisplay}>{Math.round(state.viewport.scale * 100)}%</span>
        <button onClick={handleZoomIn} style={styles.button}>
          +
        </button>
        <button onClick={handleResetView} style={styles.button}>
          Reset View
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    height: '60px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    boxSizing: 'border-box',
  },
  leftSection: {
    display: 'flex',
    gap: '10px',
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  stats: {
    fontSize: '14px',
    color: '#666',
  },
  zoomDisplay: {
    fontSize: '14px',
    color: '#333',
    minWidth: '50px',
    textAlign: 'center',
  },
};

