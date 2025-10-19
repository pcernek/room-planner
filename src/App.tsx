import React from 'react';
import { RoomProvider } from './store/RoomContext';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';

function App() {
  return (
    <RoomProvider>
      <div style={styles.container}>
        <Toolbar />
        <div style={styles.mainContent}>
          <Sidebar />
          <div style={styles.canvasContainer}>
            <Canvas />
          </div>
        </div>
      </div>
    </RoomProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
};

export default App;

