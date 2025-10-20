import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IDoor, Unit } from '../../types';
import { propertyPanelStyles as styles } from './propertyPanelStyles';

interface IProps {
  door: IDoor;
  unit: Unit;
  onUpdate: (id: string, updates: { offsetFromStart?: number; width?: number }) => void;
  onDelete: () => void;
}

export function DoorPropertiesPanel({ door, unit, onUpdate, onDelete }: IProps) {
  const [editableOffset, setEditableOffset] = useState(door.offsetFromStart.toString());
  const [editableWidth, setEditableWidth] = useState(door.width.toString());

  const unitLabel = unit === 'cm' ? 'cm' : 'in';

  useEffect(() => {
    setEditableOffset(door.offsetFromStart.toString());
    setEditableWidth(door.width.toString());
  }, [door.id, door.offsetFromStart, door.width]);

  const debouncedUpdate = useDebouncedCallback(
    (updates: { offsetFromStart?: number; width?: number }) => {
      onUpdate(door.id, updates);
    },
    500
  );

  return (
    <div style={styles.propertyPanel}>
      <h3 style={styles.panelTitle}>Door Properties</h3>
      <div style={styles.propertyContent}>
        <div style={styles.propertyColumn}>
          <label style={styles.label}>Offset ({unitLabel})</label>
          <input
            type="number"
            step="any"
            value={editableOffset}
            onChange={(e) => {
              setEditableOffset(e.target.value);
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value >= 0) {
                debouncedUpdate({ offsetFromStart: value });
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
        <button onClick={onDelete} style={styles.deleteButton}>
          Delete Door
        </button>
      </div>
    </div>
  );
}

