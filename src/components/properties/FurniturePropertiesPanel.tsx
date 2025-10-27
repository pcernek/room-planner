import { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IFurniture, Unit } from '../../types';
import { propertyPanelStyles as styles } from './propertyPanelStyles';

interface IProps {
  furniture: IFurniture;
  unit: Unit;
  onUpdate: (
    id: string,
    updates: { name?: string; width?: number; height?: number; rotation?: number }
  ) => void;
  onDelete: () => void;
}

export function FurniturePropertiesPanel({ furniture, unit, onUpdate, onDelete }: IProps) {
  const [editableName, setEditableName] = useState(furniture.name);
  const [editableWidth, setEditableWidth] = useState(furniture.width.toString());
  const [editableHeight, setEditableHeight] = useState(furniture.height.toString());
  const [editableRotation, setEditableRotation] = useState(furniture.rotation.toString());
  const nameInputRef = useRef<HTMLInputElement>(null);

  const unitLabel = unit === 'cm' ? 'cm' : 'in';

  useEffect(() => {
    setEditableName(furniture.name);
    setEditableWidth(furniture.width.toString());
    setEditableHeight(furniture.height.toString());
    setEditableRotation(furniture.rotation.toString());

    // Focus name input when furniture changes (e.g., newly created)
    if (nameInputRef.current && furniture.name === 'New Furniture') {
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 0);
    }
  }, [furniture.id, furniture.name, furniture.width, furniture.height, furniture.rotation]);

  const debouncedUpdate = useDebouncedCallback(
    (updates: { name?: string; width?: number; height?: number; rotation?: number }) => {
      onUpdate(furniture.id, updates);
    },
    500
  );

  return (
    <div style={styles.propertyPanel}>
      <h3 style={styles.panelTitle}>Furniture</h3>
      <div style={styles.propertyContent}>
        <div style={styles.propertyColumn}>
          <label style={styles.label}>Name</label>
          <input
            ref={nameInputRef}
            type="text"
            value={editableName}
            onChange={(e) => {
              setEditableName(e.target.value);
              debouncedUpdate({ name: e.target.value });
            }}
            style={styles.input}
          />
        </div>
        <div style={styles.propertyColumn}>
          <label style={styles.label}>Width ({unitLabel})</label>
          <input
            type="number"
            step="any"
            value={editableWidth}
            onChange={(e) => {
              setEditableWidth(e.target.value);
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                debouncedUpdate({ width: value });
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
            value={editableHeight}
            onChange={(e) => {
              setEditableHeight(e.target.value);
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                debouncedUpdate({ height: value });
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
            value={editableRotation}
            onChange={(e) => {
              setEditableRotation(e.target.value);
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                debouncedUpdate({ rotation: value % 360 });
              }
            }}
            style={styles.input}
          />
        </div>
        <button onClick={onDelete} style={styles.deleteButton}>
          Delete Furniture
        </button>
      </div>
    </div>
  );
}
