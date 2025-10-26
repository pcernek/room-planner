import { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useRoom } from '../store/RoomContext';
import { useEditor } from '../store/EditorContext';
import { calculateWallGeometries } from '../utils/geometry';
import { Unit } from '../types';
import { Wall } from './canvas/Wall';
import { Door } from './canvas/Door';
import { Furniture } from './canvas/Furniture';
import { NewWallModal } from './NewWallModal';
import { RoomSetupModal } from './RoomSetupModal';
import { PreviewLayer } from './canvas/PreviewLayer';
import { useFurniturePlacement } from '../hooks/useFurniturePlacement';
import { useCursorEffect } from '../hooks/useCursorEffect';
import { useWallCreationModal } from '../hooks/useWallCreationModal';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useEntitySelection } from '../hooks/useEntitySelection';

export function Canvas() {
  const { state, dispatch } = useRoom();
  const { state: editorState, setCanvasDimensions, setViewport, setActiveTool } = useEditor();
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageContainer, setStageContainer] = useState<HTMLDivElement | null>(null);
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);

  const furniturePlacement = useFurniturePlacement();
  const wallCreationModal = useWallCreationModal();
  const entitySelection = useEntitySelection();
  const canvasInteraction = useCanvasInteraction({
    viewport: editorState.viewport,
    setViewport,
  });

  useEffect(() => {
    if (stageRef.current) {
      setStageContainer(stageRef.current.container());
    }
  }, []);

  useCursorEffect(stageContainer);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setCanvasDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [setCanvasDimensions]);

  // Reset furniture placement when switching tools
  useEffect(() => {
    if (editorState.activeTool !== 'placeFurniture') {
      furniturePlacement.reset();
    }
  }, [editorState.activeTool, furniturePlacement]);

  const wallGeometries = useMemo(
    () => state.room ? calculateWallGeometries(state.room.walls, state.room.originWallId) : new Map(),
    [state.room?.walls, state.room?.originWallId]
  );

  const [firstWallId, lastWallId] = useMemo(() => {
    if (!state.room || state.room.walls.length === 0) {
      return [null, null];
    }

    const firstWall = state.room.walls[0]
    const lastWall = state.room.walls[state.room.walls.length - 1];
    return [firstWall?.id, lastWall?.id];
  }, [state.room?.walls.length]);

  function handleFurnitureDragEnd(furnitureId: string, x: number, y: number) {
    furniturePlacement.handleFurnitureDragEnd();
    dispatch({
      type: 'UPDATE_FURNITURE',
      payload: {
        id: furnitureId,
        updates: { position: { x, y } },
      },
    });
  }

  function handleRoomSetup(name: string, unit: Unit) {
    dispatch({ type: 'INITIALIZE_ROOM', payload: { name, unit } });
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (editorState.activeTool === 'placeFurniture' && state.room) {
      const stage = e.target.getStage();
      if (!stage) return;

      const newFurniture = furniturePlacement.handleStageClick(stage, editorState.viewport, state.room.unit);

      if (newFurniture) {
        dispatch({ type: 'ADD_FURNITURE', payload: newFurniture });
        setActiveTool('select');
      }
      return;
    }

    if (e.target === e.target.getStage()) {
      entitySelection.clearSelection();
    }
  }

  function handleStageMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (editorState.activeTool === 'placeFurniture' && state.room) {
      const stage = e.target.getStage();
      if (!stage) return;

      furniturePlacement.handleStageMouseMove(stage, editorState.viewport, state.room.unit);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Stage
        ref={stageRef}
        width={editorState.canvasDimensions.width}
        height={editorState.canvasDimensions.height}
        draggable={!furniturePlacement.isFurnitureDragging && editorState.activeTool !== 'placeFurniture'}
        onDragStart={canvasInteraction.handleStageDragStart}
        onDragEnd={canvasInteraction.handleStageDragEnd}
        onWheel={canvasInteraction.handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleStageMouseMove}
        x={editorState.viewport.offsetX}
        y={editorState.viewport.offsetY}
        scaleX={editorState.viewport.scale}
        scaleY={editorState.viewport.scale}
        style={{ border: '1px solid #ddd', backgroundColor: '#fff' }}
      >
        <Layer>
          {Array.from(wallGeometries.values()).map((geometry) => (
            <Wall
              key={geometry.id}
              geometry={geometry}
              unit={state.room?.unit || 'cm'}
              isSelected={!hoveredWallId && state.selectedEntityId === geometry.id && state.selectedEntityType === 'wall'}
              isHovered={hoveredWallId === geometry.id}
              hasStartFree={geometry.id === firstWallId}
              hasEndFree={geometry.id === lastWallId}
              onSelect={(e) => entitySelection.handleWallClick(geometry.id, e, canvasInteraction.isDragging)}
              onMouseEnter={() => setHoveredWallId(geometry.id)}
              onMouseLeave={() => setHoveredWallId(null)}
              onNewWallClick={(endpoint, angle) => wallCreationModal.handleNewWallClick(geometry.id, endpoint, angle)}
            />
          ))}

          {state.room?.doors.map((door) => {
            const wallGeometry = wallGeometries.get(door.wallId);
            if (!wallGeometry) return null;
            return (
              <Door
                key={door.id}
                door={door}
                wallGeometry={wallGeometry}
                unit={state.room?.unit || 'cm'}
                isSelected={state.selectedEntityId === door.id && state.selectedEntityType === 'door'}
                onSelect={() => entitySelection.selectDoor(door.id)}
              />
            );
          })}

          {state.room?.furniture.map((furniture) => (
            <Furniture
              key={furniture.id}
              furniture={furniture}
              unit={state.room?.unit || 'cm'}
              isSelected={state.selectedEntityId === furniture.id && state.selectedEntityType === 'furniture'}
              onSelect={() => entitySelection.selectFurniture(furniture.id)}
              onDragStart={furniturePlacement.handleFurnitureDragStart}
              onDragEnd={(x, y) => handleFurnitureDragEnd(furniture.id, x, y)}
            />
          ))}

          {state.room && (
            <PreviewLayer
              furnitureStart={furniturePlacement.furnitureStart}
              previewRect={furniturePlacement.previewRect}
              unit={state.room.unit}
            />
          )}
        </Layer>
      </Stage>

      <RoomSetupModal
        isOpen={!state.room}
        onConfirm={handleRoomSetup}
      />

      <NewWallModal
        isOpen={wallCreationModal.isModalOpen && state.room !== null}
        unit={state.room?.unit || 'cm'}
        onConfirm={wallCreationModal.handleModalConfirm}
        onCancel={wallCreationModal.handleModalCancel}
      />
    </div>
  );
}
