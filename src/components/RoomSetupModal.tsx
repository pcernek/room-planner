import React, { useState } from 'react';
import { Unit } from '../types';

interface IProps {
  isOpen: boolean;
  onConfirm: (name: string, unit: Unit) => void;
}

export function RoomSetupModal({ isOpen, onConfirm }: IProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Unit>('cm');

  if (!isOpen) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      alert('Please enter a room name');
      return;
    }
    onConfirm(name.trim(), unit);
    setName('');
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>Create New Room</h3>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Room Name</label>
            <input
              type="text"
              placeholder="e.g. Living Room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Units</label>
            <div style={styles.unitSelector}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="cm"
                  checked={unit === 'cm'}
                  onChange={(e) => setUnit(e.target.value as Unit)}
                  style={styles.radio}
                />
                Centimeters
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="ft-in"
                  checked={unit === 'ft-in'}
                  onChange={(e) => setUnit(e.target.value as Unit)}
                  style={styles.radio}
                />
                Inches
              </label>
            </div>
          </div>

          <div style={styles.buttons}>
            <button type="submit" style={styles.confirmButton}>
              Start Planning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    minWidth: '400px',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: 'normal',
    color: '#333',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  unitSelector: {
    display: 'flex',
    gap: '20px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  radio: {
    cursor: 'pointer',
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  confirmButton: {
    padding: '10px 20px',
    backgroundColor: '#4A90E2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
};
