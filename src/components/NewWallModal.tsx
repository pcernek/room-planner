import React, { useState } from 'react';
import { Unit } from '../types';

interface IProps {
  isOpen: boolean;
  unit: Unit;
  onConfirm: (length: number, unit: Unit) => void;
  onCancel: () => void;
}

export function NewWallModal({ isOpen, unit, onConfirm, onCancel }: IProps) {
  const [length, setLength] = useState('');

  if (!isOpen) return null;

  const unitLabel = unit === 'cm' ? 'cm' : 'in';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const numLength = parseFloat(length);
    if (isNaN(numLength) || numLength <= 0) {
      alert('Please enter a valid length');
      return;
    }
    onConfirm(numLength, unit);
    setLength('');
  }

  function handleCancel() {
    setLength('');
    onCancel();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>Length of the first wall ({unitLabel})</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            step="any"
            placeholder={`Length (${unitLabel})`}
            value={length}
            onChange={(e) => setLength(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <div style={styles.buttons}>
            <button type="button" onClick={handleCancel} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.confirmButton}>
              Create Wall
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
    borderRadius: '8px',
    padding: '24px',
    minWidth: '300px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'normal',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  unitSelector: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  radio: {
    cursor: 'pointer',
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '10px 20px',
    backgroundColor: '#4A90E2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
