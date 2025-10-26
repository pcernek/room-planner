import React, { useRef, useState, useEffect } from 'react';
import { useRoom } from '../store/RoomContext';
import { useEditor } from '../store/EditorContext';
import { IRoom } from '../types';
import { calculateWallGeometries } from '../utils/geometry';
import { calculateBoundingBox, calculateCenteredViewport } from '../utils/viewport';

export function Toolbar() {
  const { state, dispatch } = useRoom();
  const { state: editorState, setViewport } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
    }

    if (isFileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isFileMenuOpen]);

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
      } catch {
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
    setViewport({ scale: Math.min(5, editorState.viewport.scale * 1.2) });
  }

  function handleZoomOut() {
    setViewport({ scale: Math.max(0.1, editorState.viewport.scale / 1.2) });
  }

  function handleRecenterView() {
    const BUFFER = 80;
    const { width, height } = editorState.canvasDimensions;

    if (!state.room || state.room.walls.length === 0) {
      setViewport({ offsetX: width / 2, offsetY: height / 2, scale: 1 });
      return;
    }

    const wallGeometries = calculateWallGeometries(state.room.walls);
    const boundingBox = calculateBoundingBox(wallGeometries, state.room);
    const viewport = calculateCenteredViewport(boundingBox, width, height, BUFFER, state.room.unit);

    setViewport(viewport);
  }

  function handleStartFromScratch() {
    const confirmed = window.confirm(
      'Are you sure you want to delete the current project? This action cannot be undone.'
    );
    if (confirmed) {
      dispatch({ type: 'CLEAR_ROOM' });
      setIsFileMenuOpen(false);
    }
  }

  function handleImportClick() {
    handleImport();
    setIsFileMenuOpen(false);
  }

  function handleExportClick() {
    handleExport();
    setIsFileMenuOpen(false);
  }

  return (
    <div style={styles.toolbar}>
      <div style={styles.leftSection}>
        <div style={styles.menuContainer} ref={menuRef}>
          <button onClick={() => setIsFileMenuOpen(!isFileMenuOpen)} style={styles.button}>
            File ▾
          </button>
          {isFileMenuOpen && (
            <div style={styles.dropdown}>
              <button
                onClick={handleImportClick}
                style={{
                  ...styles.menuItem,
                  backgroundColor: hoveredMenuItem === 'import' ? '#f5f5f5' : 'transparent',
                }}
                onMouseEnter={() => setHoveredMenuItem('import')}
                onMouseLeave={() => setHoveredMenuItem(null)}
              >
                Import JSON
              </button>
              <button
                onClick={handleExportClick}
                style={{
                  ...styles.menuItem,
                  backgroundColor: hoveredMenuItem === 'export' ? '#f5f5f5' : 'transparent',
                }}
                onMouseEnter={() => setHoveredMenuItem('export')}
                onMouseLeave={() => setHoveredMenuItem(null)}
              >
                Export JSON
              </button>
              <div style={styles.menuDivider} />
              <button
                onClick={handleStartFromScratch}
                style={{
                  ...styles.menuItemDanger,
                  backgroundColor: hoveredMenuItem === 'clear' ? '#ffebee' : 'transparent',
                }}
                onMouseEnter={() => setHoveredMenuItem('clear')}
                onMouseLeave={() => setHoveredMenuItem(null)}
              >
                Start from Scratch
              </button>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={styles.centerSection}>
        {state.room && (
          <>
            <span style={styles.roomName}>{state.room.name}</span>
            <span style={styles.stats}>
              Walls: {state.room.walls.length} | Doors: {state.room.doors.length} | Furniture:{' '}
              {state.room.furniture.length}
            </span>
          </>
        )}
      </div>

      <div style={styles.rightSection}>
        <button onClick={handleZoomOut} style={styles.button}>
          −
        </button>
        <span style={styles.zoomDisplay}>{Math.round(editorState.viewport.scale * 100)}%</span>
        <button onClick={handleZoomIn} style={styles.button}>
          +
        </button>
        <button onClick={handleRecenterView} style={styles.button}>
          Recenter View
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
    gap: '20px',
  },
  roomName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
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
  menuContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    minWidth: '180px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  menuItem: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  menuItemDanger: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#E24A4A',
    transition: 'background-color 0.2s',
  },
  menuDivider: {
    height: '1px',
    backgroundColor: '#ddd',
    margin: '4px 0',
  },
};
