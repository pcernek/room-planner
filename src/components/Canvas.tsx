import { useState, useRef, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useRoom } from '../store/RoomContext';
import { useEditor } from '../store/EditorContext';
import { Unit } from '../types';
import { RoomStructure } from './canvas/RoomStructure';
import { Furniture } from './canvas/Furniture';
import { NewWallModal } from './NewWallModal';
import { RoomSetupModal } from './RoomSetupModal';
import { PreviewLayer } from './canvas/PreviewLayer';
import { useFurniturePlacement } from '../hooks/useFurniturePlacement';
import { useWallPlacement } from '../hooks/useWallPlacement';
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

  const furniturePlacement = useFurniturePlacement();
  const wallPlacement = useWallPlacement();
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

  // Reset wall placement when switching tools
  useEffect(() => {
    if (editorState.activeTool !== 'placeWall') {
      wallPlacement.reset();
    }
  }, [editorState.activeTool, wallPlacement]);

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

  function handleWallSequenceDragStart() {
    furniturePlacement.handleFurnitureDragStart();
  }

  function handleWallSequenceDragEnd(sequenceId: string, x: number, y: number) {
    furniturePlacement.handleFurnitureDragEnd();
    dispatch({
      type: 'UPDATE_WALL_SEQUENCE_POSITION',
      payload: {
        id: sequenceId,
        position: { x, y },
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

      const newFurniture = furniturePlacement.handleStageClick(
        stage,
        editorState.viewport,
        state.room.unit
      );

      if (newFurniture) {
        dispatch({ type: 'ADD_FURNITURE', payload: newFurniture });
        setActiveTool('select');
      }
      return;
    }

    if (editorState.activeTool === 'placeWall' && state.room) {
      const stage = e.target.getStage();
      if (!stage) return;

      const startPoint = wallPlacement.handleStageClick(
        stage,
        editorState.viewport,
        state.room.unit
      );

      if (startPoint) {
        wallCreationModal.openModalForNewWall(startPoint);
        wallPlacement.reset();
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

  const room = state.room;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Stage
        ref={stageRef}
        width={editorState.canvasDimensions.width}
        height={editorState.canvasDimensions.height}
        draggable={
          !furniturePlacement.isFurnitureDragging &&
          editorState.activeTool !== 'placeFurniture' &&
          editorState.activeTool !== 'placeWall'
        }
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
        {room && (
          <Layer>
            <RoomStructure
              wallSequences={room.wallSequences}
              doors={room.doors}
              unit={room.unit}
              selectedEntityId={state.selectedEntityId}
              selectedEntityType={state.selectedEntityType}
              onWallSelect={entitySelection.handleWallClick}
              onDoorSelect={entitySelection.selectDoor}
              onNewWallClick={wallCreationModal.handleNewWallClick}
              onWallSequenceDragStart={handleWallSequenceDragStart}
              onWallSequenceDragEnd={handleWallSequenceDragEnd}
              isDragging={canvasInteraction.isDragging}
            />

            {room.furniture.map((furniture) => (
              <Furniture
                key={furniture.id}
                furniture={furniture}
                unit={room.unit}
                isSelected={
                  state.selectedEntityId === furniture.id &&
                  state.selectedEntityType === 'furniture'
                }
                onSelect={() => entitySelection.selectFurniture(furniture.id)}
                onDragStart={furniturePlacement.handleFurnitureDragStart}
                onDragEnd={(x, y) => handleFurnitureDragEnd(furniture.id, x, y)}
              />
            ))}

            <PreviewLayer
              furnitureStart={furniturePlacement.furnitureStart}
              previewRect={furniturePlacement.previewRect}
              unit={room.unit}
            />
          </Layer>
        )}
      </Stage>

      <RoomSetupModal isOpen={!room} onConfirm={handleRoomSetup} />

      {room && (
        <NewWallModal
          isOpen={wallCreationModal.isModalOpen}
          unit={room.unit}
          onConfirm={wallCreationModal.handleModalConfirm}
          onCancel={wallCreationModal.handleModalCancel}
        />
      )}
    </div>
  );
}
