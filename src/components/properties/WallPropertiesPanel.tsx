import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IWall, Unit } from '../../types';
import { propertyPanelStyles as styles } from './propertyPanelStyles';

interface IProps {
  wall: IWall;
  unit: Unit;
  canDelete: boolean;
  isStandalone: boolean;
  onUpdate: (id: string, updates: { length?: number; angle?: number }) => void;
  onDelete: () => void;
}

export function WallPropertiesPanel({ wall, unit, canDelete, isStandalone, onUpdate, onDelete }: IProps) {
  const [editableLength, setEditableLength] = useState(wall.length.toString());
  const [editableAngle, setEditableAngle] = useState(wall.angle.toString());

  const unitLabel = unit === 'cm' ? 'cm' : 'in';

  useEffect(() => {
    setEditableLength(wall.length.toString());
    setEditableAngle(wall.angle.toString());
  }, [wall.id, wall.length, wall.angle]);

  const debouncedUpdate = useDebouncedCallback(
    (updates: { length?: number; angle?: number }) => {
      onUpdate(wall.id, updates);
    },
    500
  );

  return (
    <div style={styles.propertyPanel}>
      <h3 style={styles.panelTitle}>Wall Properties</h3>
      <div style={styles.propertyContent}>
        <div style={styles.propertyColumn}>
          <label style={styles.label}>Length ({unitLabel})</label>
          <input
            type="number"
            step="any"
            value={editableLength}
            onChange={(e) => {
              setEditableLength(e.target.value);
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                debouncedUpdate({ length: value });
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
              value={editableAngle}
              onChange={(e) => {
                setEditableAngle(e.target.value);
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  debouncedUpdate({ angle: value % 360 });
                }
              }}
              style={styles.input}
            />
          </div>
        )}
        {canDelete && (
          <button onClick={onDelete} style={styles.deleteButton}>
            Delete Wall
          </button>
        )}
      </div>
    </div>
  );
}

