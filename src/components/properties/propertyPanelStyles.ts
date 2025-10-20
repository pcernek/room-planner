import React from 'react';

export const propertyPanelStyles: Record<string, React.CSSProperties> = {
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
  label: {
    fontWeight: 'bold',
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
};

