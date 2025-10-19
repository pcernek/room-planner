import React, { useState } from 'react';
import { useRoom } from '../store/RoomContext';
import { parseDimension } from '../utils/units';
import { IWall, IDoor, IFurniture } from '../types';

export function Sidebar() {
  const { state, dispatch } = useRoom();
  const [wallLength, setWallLength] = useState('');
  const [wallAngle, setWallAngle] = useState(0);
  const [doorOffset, setDoorOffset] = useState('');
  const [doorWidth, setDoorWidth] = useState('');
  const [furnitureName, setFurnitureName] = useState('Sofa');
  const [furnitureWidth, setFurnitureWidth] = useState('');
  const [furnitureHeight, setFurnitureHeight] = useState('');

  function handleAddWall() {
    const parsed = parseDimension(wallLength);
    if (!parsed) {
      alert('Invalid dimension. Use format like "100 cm" or "3\' 6"');
      return;
    }

    const previousWallId = state.room.walls.length > 0 && state.selectedEntityId && state.selectedEntityType === 'wall'
      ? state.selectedEntityId
      : null;

    const newWall: IWall = {
      id: `wall-${Date.now()}-${Math.random()}`,
      length: parsed.value,
      angle: wallAngle,
      previousWallId,
      unit: parsed.unit,
    };

    dispatch({ type: 'ADD_WALL', payload: newWall });
    setWallLength('');
  }

  function handleAddDoor() {
    if (!state.selectedEntityId || state.selectedEntityType !== 'wall') {
      alert('Please select a wall first');
      return;
    }

    const offsetParsed = parseDimension(doorOffset);
    const widthParsed = parseDimension(doorWidth);

    if (!offsetParsed || !widthParsed) {
      alert('Invalid dimension. Use format like "100 cm" or "3\' 6"');
      return;
    }

    const newDoor: IDoor = {
      id: `door-${Date.now()}-${Math.random()}`,
      wallId: state.selectedEntityId,
      offsetFromStart: offsetParsed.value,
      width: widthParsed.value,
      unit: offsetParsed.unit,
    };

    dispatch({ type: 'ADD_DOOR', payload: newDoor });
    setDoorOffset('');
    setDoorWidth('');
  }

  function handleAddFurniture() {
    const widthParsed = parseDimension(furnitureWidth);
    const heightParsed = parseDimension(furnitureHeight);

    if (!widthParsed || !heightParsed) {
      alert('Invalid dimension. Use format like "100 cm" or "3\' 6"');
      return;
    }

    const newFurniture: IFurniture = {
      id: `furniture-${Date.now()}-${Math.random()}`,
      name: furnitureName,
      position: { x: 50, y: 50 },
      width: widthParsed.value,
      height: heightParsed.value,
      rotation: 0,
      unit: widthParsed.unit,
    };

    dispatch({ type: 'ADD_FURNITURE', payload: newFurniture });
    setFurnitureWidth('');
    setFurnitureHeight('');
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

  function renderSelectedEntityPanel() {
    if (!state.selectedEntityId || !state.selectedEntityType) {
      return <div style={styles.noSelection}>No entity selected</div>;
    }

    if (state.selectedEntityType === 'wall') {
      const wall = state.room.walls.find((w) => w.id === state.selectedEntityId);
      if (!wall) return null;

      return (
        <div style={styles.propertyPanel}>
          <h3 style={styles.panelTitle}>Wall Properties</h3>
          <div style={styles.property}>
            <label style={styles.label}>Length:</label>
            <span>{wall.length} {wall.unit}</span>
          </div>
          <div style={styles.property}>
            <label style={styles.label}>Angle:</label>
            <span>{wall.angle}°</span>
          </div>
          <button onClick={handleDeleteSelected} style={styles.deleteButton}>
            Delete Wall
          </button>
        </div>
      );
    }

    if (state.selectedEntityType === 'door') {
      const door = state.room.doors.find((d) => d.id === state.selectedEntityId);
      if (!door) return null;

      return (
        <div style={styles.propertyPanel}>
          <h3 style={styles.panelTitle}>Door Properties</h3>
          <div style={styles.property}>
            <label style={styles.label}>Offset:</label>
            <span>{door.offsetFromStart} {door.unit}</span>
          </div>
          <div style={styles.property}>
            <label style={styles.label}>Width:</label>
            <span>{door.width} {door.unit}</span>
          </div>
          <button onClick={handleDeleteSelected} style={styles.deleteButton}>
            Delete Door
          </button>
        </div>
      );
    }

    if (state.selectedEntityType === 'furniture') {
      const furniture = state.room.furniture.find((f) => f.id === state.selectedEntityId);
      if (!furniture) return null;

      return (
        <div style={styles.propertyPanel}>
          <h3 style={styles.panelTitle}>Furniture Properties</h3>
          <div style={styles.property}>
            <label style={styles.label}>Name:</label>
            <span>{furniture.name}</span>
          </div>
          <div style={styles.property}>
            <label style={styles.label}>Position:</label>
            <span>({furniture.position.x.toFixed(1)}, {furniture.position.y.toFixed(1)})</span>
          </div>
          <div style={styles.property}>
            <label style={styles.label}>Size:</label>
            <span>{furniture.width} × {furniture.height} {furniture.unit}</span>
          </div>
          <div style={styles.property}>
            <label style={styles.label}>Rotation:</label>
            <span>{furniture.rotation}°</span>
          </div>
          <button onClick={handleDeleteSelected} style={styles.deleteButton}>
            Delete Furniture
          </button>
        </div>
      );
    }

    return null;
  }

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>Room Planner</h2>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Add Wall</h3>
        <input
          type="text"
          placeholder="Length (e.g. 300cm or 10')"
          value={wallLength}
          onChange={(e) => setWallLength(e.target.value)}
          style={styles.input}
        />
        <div style={styles.angleControl}>
          <button onClick={() => setWallAngle(a => a - 90)} style={styles.smallButton}>
            ↶ 90°
          </button>
          <span style={styles.angleDisplay}>{wallAngle}°</span>
          <button onClick={() => setWallAngle(a => a + 90)} style={styles.smallButton}>
            ↷ 90°
          </button>
        </div>
        <input
          type="number"
          placeholder="Angle (degrees)"
          value={wallAngle}
          onChange={(e) => setWallAngle(parseFloat(e.target.value) || 0)}
          style={styles.input}
        />
        <button onClick={handleAddWall} style={styles.button}>
          Add Wall
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Add Door</h3>
        <p style={styles.hint}>Select a wall first</p>
        <input
          type="text"
          placeholder="Offset (e.g. 50cm or 2')"
          value={doorOffset}
          onChange={(e) => setDoorOffset(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Width (e.g. 80cm or 3')"
          value={doorWidth}
          onChange={(e) => setDoorWidth(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAddDoor} style={styles.button}>
          Add Door
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Add Furniture</h3>
        <input
          type="text"
          placeholder="Name"
          value={furnitureName}
          onChange={(e) => setFurnitureName(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Width (e.g. 200cm or 6')"
          value={furnitureWidth}
          onChange={(e) => setFurnitureWidth(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Height (e.g. 100cm or 3')"
          value={furnitureHeight}
          onChange={(e) => setFurnitureHeight(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAddFurniture} style={styles.button}>
          Add Furniture
        </button>
      </div>

      <div style={styles.section}>
        {renderSelectedEntityPanel()}
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
  deleteButton: {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    backgroundColor: '#E24A4A',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  angleControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  smallButton: {
    padding: '8px 12px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  angleDisplay: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  hint: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  propertyPanel: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '4px',
  },
  panelTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#333',
  },
  property: {
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
  },
  noSelection: {
    padding: '15px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
};

