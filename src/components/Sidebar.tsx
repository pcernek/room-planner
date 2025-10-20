import React, { useState } from 'react';
import { useRoom } from '../store/RoomContext';
import { INewDoor, INewFurniture } from '../types';

export function Sidebar() {
  const { state, dispatch } = useRoom();
  const [wallLength, setWallLength] = useState('');
  const [doorOffset, setDoorOffset] = useState('');
  const [doorWidth, setDoorWidth] = useState('');
  const [furnitureName, setFurnitureName] = useState('Sofa');
  const [furnitureWidth, setFurnitureWidth] = useState('');
  const [furnitureHeight, setFurnitureHeight] = useState('');

  if (!state.room) {
    return (
      <div style={styles.sidebar}>
        <h2 style={styles.title}>Room Planner</h2>
        <div style={styles.noSelection}>Create a room to start planning</div>
      </div>
    );
  }

  const unit = state.room.unit;
  const unitLabel = unit === 'cm' ? 'cm' : 'in';

  function handleAddDoor() {
    if (!state.selectedEntityId || state.selectedEntityType !== 'wall') {
      alert('Please select a wall first');
      return;
    }

    const offsetValue = parseFloat(doorOffset);
    const widthValue = parseFloat(doorWidth);

    if (isNaN(offsetValue) || offsetValue <= 0 || isNaN(widthValue) || widthValue <= 0) {
      alert(`Please enter valid dimensions in ${unitLabel}`);
      return;
    }

    const newDoor: INewDoor = {
      wallId: state.selectedEntityId,
      offsetFromStart: offsetValue,
      width: widthValue,
      unit,
    };

    dispatch({ type: 'ADD_DOOR', payload: newDoor });
    setDoorOffset('');
    setDoorWidth('');
  }

  function handleAddFurniture() {
    const widthValue = parseFloat(furnitureWidth);
    const heightValue = parseFloat(furnitureHeight);

    if (isNaN(widthValue) || widthValue <= 0 || isNaN(heightValue) || heightValue <= 0) {
      alert(`Please enter valid dimensions in ${unitLabel}`);
      return;
    }

    const newFurniture: INewFurniture = {
      name: furnitureName,
      position: { x: 50, y: 50 },
      width: widthValue,
      height: heightValue,
      rotation: 0,
      unit,
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

  function handleRotateWall() {
    if (!state.room || !state.selectedEntityId || state.selectedEntityType !== 'wall') return;

    const wall = state.room.walls.find((w) => w.id === state.selectedEntityId);
    if (!wall) return;

    const newAngle = (wall.angle + 90) % 360;
    dispatch({
      type: 'UPDATE_WALL',
      payload: {
        id: state.selectedEntityId,
        updates: { angle: newAngle },
      },
    });
  }

  function handleUpdateWallLength() {
    if (!state.selectedEntityId || state.selectedEntityType !== 'wall') return;

    const lengthValue = parseFloat(wallLength);

    if (isNaN(lengthValue) || lengthValue <= 0) {
      alert(`Please enter a valid dimension in ${unitLabel}`);
      return;
    }

    dispatch({
      type: 'UPDATE_WALL',
      payload: {
        id: state.selectedEntityId,
        updates: { length: lengthValue, unit },
      },
    });

    setWallLength('');
  }

  function renderSelectedEntityPanel() {
    if (!state.room || !state.selectedEntityId || !state.selectedEntityType) {
      return <div style={styles.noSelection}>No entity selected</div>;
    }

    if (state.selectedEntityType === 'wall') {
      const wall = state.room.walls.find((w) => w.id === state.selectedEntityId);
      if (!wall) return null;

      const canDelete = state.selectedEntityId === state.room.walls[0]?.id || state.selectedEntityId === state.room.walls[state.room.walls.length - 1]?.id;
      const isStandalone = state.room.walls.length === 1;

      return (
        <div style={styles.propertyPanel}>
          <h3 style={styles.panelTitle}>Wall Properties</h3>
          <div style={styles.propertyContent}>
            <div style={styles.property}>
              <label style={styles.label}>Length:</label>
              <span>{wall.length} {unitLabel}</span>
            </div>
            <div>
              <input
                type="number"
                step="any"
                value={wallLength}
                onChange={(e) => setWallLength(e.target.value)}
                placeholder={`e.g. ${unit === 'cm' ? '200' : '72'}`}
                style={styles.input}
              />
              <button onClick={handleUpdateWallLength} style={styles.button}>
                Update Length
              </button>
            </div>
            {isStandalone && (
              <button onClick={handleRotateWall} style={styles.button}>
                Rotate 90°
              </button>
            )}
            {canDelete && (
              <button onClick={handleDeleteSelected} style={styles.deleteButton}>
                Delete Wall
              </button>
            )}
          </div>
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
            <span>{door.offsetFromStart} {unitLabel}</span>
          </div>
          <div style={styles.property}>
            <label style={styles.label}>Width:</label>
            <span>{door.width} {unitLabel}</span>
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
            <label style={styles.label}>Size:</label>
            <span>{furniture.width} × {furniture.height} {unitLabel}</span>
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
        <h3 style={styles.sectionTitle}>Add Door</h3>
        <p style={styles.hint}>Select a wall first</p>
        <input
          type="number"
          step="any"
          placeholder={`Offset (${unitLabel})`}
          value={doorOffset}
          onChange={(e) => setDoorOffset(e.target.value)}
          style={styles.input}
        />
        <input
          type="number"
          step="any"
          placeholder={`Width (${unitLabel})`}
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
          type="number"
          step="any"
          placeholder={`Width (${unitLabel})`}
          value={furnitureWidth}
          onChange={(e) => setFurnitureWidth(e.target.value)}
          style={styles.input}
        />
        <input
          type="number"
          step="any"
          placeholder={`Height (${unitLabel})`}
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
    backgroundColor: '#E24A4A',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  propertyContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
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

