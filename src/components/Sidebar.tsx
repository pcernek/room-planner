import React, { useState } from 'react';
import { useRoom } from '../store/RoomContext';
import { INewDoor, INewFurniture } from '../types';

export function Sidebar() {
  const { state, dispatch } = useRoom();
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

  function handleUpdateWall(updates: { length?: number; angle?: number }) {
    if (!state.selectedEntityId || state.selectedEntityType !== 'wall') return;
    dispatch({
      type: 'UPDATE_WALL',
      payload: { id: state.selectedEntityId, updates },
    });
  }

  function handleUpdateDoor(updates: { offsetFromStart?: number; width?: number }) {
    if (!state.selectedEntityId || state.selectedEntityType !== 'door') return;
    dispatch({
      type: 'UPDATE_DOOR',
      payload: { id: state.selectedEntityId, updates },
    });
  }

  function handleUpdateFurniture(updates: { name?: string; width?: number; height?: number; rotation?: number }) {
    if (!state.selectedEntityId || state.selectedEntityType !== 'furniture') return;
    dispatch({
      type: 'UPDATE_FURNITURE',
      payload: { id: state.selectedEntityId, updates },
    });
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
            <div style={styles.propertyColumn}>
              <label style={styles.label}>Length ({unitLabel})</label>
              <input
                type="number"
                step="any"
                value={wall.length}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    handleUpdateWall({ length: value });
                  }
                }}
                style={styles.input}
              />
            </div>
            {isStandalone && (
              <div style={styles.propertyColumn}>
                <label style={styles.label}>Angle (°)</label>
                <input
                  type="number"
                  step="any"
                  value={wall.angle}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      handleUpdateWall({ angle: value % 360 });
                    }
                  }}
                  style={styles.input}
                />
              </div>
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
          <div style={styles.propertyContent}>
            <div style={styles.propertyColumn}>
              <label style={styles.label}>Offset ({unitLabel})</label>
              <input
                type="number"
                step="any"
                value={door.offsetFromStart}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0) {
                    handleUpdateDoor({ offsetFromStart: value });
                  }
                }}
                style={styles.input}
              />
            </div>
            <div style={styles.propertyColumn}>
              <label style={styles.label}>Width ({unitLabel})</label>
              <input
                type="number"
                step="any"
                value={door.width}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    handleUpdateDoor({ width: value });
                  }
                }}
                style={styles.input}
              />
            </div>
            <button onClick={handleDeleteSelected} style={styles.deleteButton}>
              Delete Door
            </button>
          </div>
        </div>
      );
    }

    if (state.selectedEntityType === 'furniture') {
      const furniture = state.room.furniture.find((f) => f.id === state.selectedEntityId);
      if (!furniture) return null;

      return (
        <div style={styles.propertyPanel}>
          <h3 style={styles.panelTitle}>Furniture Properties</h3>
          <div style={styles.propertyContent}>
            <div style={styles.propertyColumn}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                value={furniture.name}
                onChange={(e) => handleUpdateFurniture({ name: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.propertyColumn}>
              <label style={styles.label}>Width ({unitLabel})</label>
              <input
                type="number"
                step="any"
                value={furniture.width}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    handleUpdateFurniture({ width: value });
                  }
                }}
                style={styles.input}
              />
            </div>
            <div style={styles.propertyColumn}>
              <label style={styles.label}>Height ({unitLabel})</label>
              <input
                type="number"
                step="any"
                value={furniture.height}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    handleUpdateFurniture({ height: value });
                  }
                }}
                style={styles.input}
              />
            </div>
            <div style={styles.propertyColumn}>
              <label style={styles.label}>Rotation (°)</label>
              <input
                type="number"
                step="any"
                value={furniture.rotation}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    handleUpdateFurniture({ rotation: value % 360 });
                  }
                }}
                style={styles.input}
              />
            </div>
            <button onClick={handleDeleteSelected} style={styles.deleteButton}>
              Delete Furniture
            </button>
          </div>
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
  propertyColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
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

