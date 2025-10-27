import { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useRoom } from '../store/RoomContext';
import { useEditor } from '../store/EditorContext';
import { Unit, INewDoor, INewWall } from '../types';
import { RoomStructure } from './canvas/RoomStructure';
import { Furniture } from './canvas/Furniture';
import { NewWallModal } from './NewWallModal';
import { RoomSetupModal } from './RoomSetupModal';
import { PreviewLayer } from './canvas/PreviewLayer';
import { WallPreviewLayer } from './canvas/WallPreviewLayer';
import { GridLayer } from './canvas/GridLayer';
import { PropertiesFloatingCard } from './PropertiesFloatingCard';
import { useFurniturePlacement } from '../hooks/useFurniturePlacement';
import { useWallPlacement } from '../hooks/useWallPlacement';
import { useDoorPlacement } from '../hooks/useDoorPlacement';
import { useCursorEffect } from '../hooks/useCursorEffect';
import { useWallCreationModal } from '../hooks/useWallCreationModal';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useEntitySelection } from '../hooks/useEntitySelection';
import { calculateWallGeometries, distance } from '../utils/geometry';
import { Angle } from '../utils/Angle';

export function Canvas() {
  const { state, dispatch } = useRoom();
  const { state: editorState, setCanvasDimensions, setViewport, setActiveTool } = useEditor();
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageContainer, setStageContainer] = useState<HTMLDivElement | null>(null);
  const [isDoorDragging, setIsDoorDragging] = useState(false);

  const furniturePlacement = useFurniturePlacement();
  const wallPlacement = useWallPlacement();
  const doorPlacement = useDoorPlacement();
  const wallCreationModal = useWallCreationModal();
  const entitySelection = useEntitySelection();
  const canvasInteraction = useCanvasInteraction({
    viewport: editorState.viewport,
    setViewport,
  });

  const wallGeometries = useMemo(
    () => (state.room ? calculateWallGeometries(state.room.wallSequences) : new Map()),
    [state.room]
  );

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

  function handleWallClickForDoorPlacement(
    wallId: string,
    e: Konva.KonvaEventObject<MouseEvent>,
    isDragging: boolean
  ) {
    if (isDragging) return;

    if (editorState.activeTool === 'placeDoor' && state.room) {
      const wallGeometry = wallGeometries.get(wallId);
      if (!wallGeometry) return;

      const defaultWidth = doorPlacement.calculateDefaultDoorWidth(
        wallGeometry.length,
        state.room.unit
      );

      const newDoor: INewDoor = {
        wallId,
        offsetFromStart: 0,
        width: defaultWidth,
        unit: state.room.unit,
      };

      dispatch({ type: 'ADD_DOOR', payload: newDoor });
      setActiveTool('select');
      return;
    }

    entitySelection.handleWallClick(wallId, e, isDragging);
  }

  function handleDoorSelect(doorId: string) {
    if (editorState.activeTool === 'placeDoor') {
      setActiveTool('select');
    }
    entitySelection.selectDoor(doorId);
  }

  function handleDoorDragStart() {
    setIsDoorDragging(true);
  }

  function handleDoorDragEnd(doorId: string, newOffsetFromStart: number) {
    setIsDoorDragging(false);
    dispatch({
      type: 'UPDATE_DOOR',
      payload: {
        id: doorId,
        updates: { offsetFromStart: newOffsetFromStart },
      },
    });
  }

  function handleFurnitureSelect(furnitureId: string) {
    if (editorState.activeTool === 'placeDoor') {
      setActiveTool('select');
    }
    entitySelection.selectFurniture(furnitureId);
  }

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

  function handleNewWallFromEndpoint(wallId: string, endpoint: 'start' | 'end') {
    if (!state.room) return;

    if (
      editorState.activeTool === 'placeWall' &&
      wallPlacement.fromWallInfo?.wallId === wallId &&
      wallPlacement.fromWallInfo?.endpoint === endpoint
    ) {
      wallPlacement.reset();
      setActiveTool('select');
      return;
    }

    const wallGeometry = wallGeometries.get(wallId);
    if (!wallGeometry) return;

    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: {
        id: wallId,
        entityType: 'wall',
      },
    });

    const startPoint = endpoint === 'start' ? wallGeometry.startPoint : wallGeometry.endPoint;
    wallPlacement.startFromEndpoint(startPoint, wallId, endpoint, wallGeometry.angle);
    setActiveTool('placeWall');
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

      const result = wallPlacement.handleStageClick(stage, editorState.viewport, state.room.unit);

      if (result) {
        const wallLength = distance(result.start, result.end);

        const minimumLength = state.room.unit === 'cm' ? 1 : 0.5;

        if (wallLength < minimumLength) {
          wallPlacement.reset();
          setActiveTool('select');
          return;
        }

        const dx = result.end.x - result.start.x;
        const dy = result.end.y - result.start.y;
        const angleRadians = Math.atan2(dy, dx);
        const angleDegrees = Angle.radians(angleRadians).getDegrees();

        if (wallPlacement.fromWallInfo) {
          const newWall: INewWall = {
            length: wallLength,
            unit: state.room.unit,
            angle: angleDegrees,
            fromNode: {
              wallId: wallPlacement.fromWallInfo.wallId,
              endpoint: wallPlacement.fromWallInfo.endpoint,
            },
          };

          dispatch({
            type: 'ADD_WALL',
            payload: newWall,
          });
        } else {
          const newWall: INewWall = {
            length: wallLength,
            unit: state.room.unit,
            angle: angleDegrees,
            fromNode: null,
          };

          dispatch({
            type: 'ADD_WALL',
            payload: { wall: newWall, startPoint: result.start },
          });
        }

        wallPlacement.reset();
        setActiveTool('select');
      }
      return;
    }

    if (e.target === e.target.getStage()) {
      if (editorState.activeTool === 'placeDoor') {
        setActiveTool('select');
      }
      entitySelection.clearSelection();
    }
  }

  function handleStageMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (editorState.activeTool === 'placeFurniture' && state.room) {
      const stage = e.target.getStage();
      if (!stage) return;

      furniturePlacement.handleStageMouseMove(stage, editorState.viewport, state.room.unit);
    }

    if (editorState.activeTool === 'placeWall' && state.room) {
      const stage = e.target.getStage();
      if (!stage) return;

      wallPlacement.handleStageMouseMove(stage, editorState.viewport, state.room.unit);
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
          !isDoorDragging &&
          editorState.activeTool !== 'placeFurniture' &&
          editorState.activeTool !== 'placeWall' &&
          !wallPlacement.wallStartPoint
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
          <>
            <Layer>
              <GridLayer
                unit={room.unit}
                viewport={editorState.viewport}
                canvasDimensions={editorState.canvasDimensions}
              />
            </Layer>
            <Layer>
              <WallPreviewLayer
                wallStart={wallPlacement.wallStartPoint}
                wallPreview={wallPlacement.isOverButton ? null : wallPlacement.wallPreviewPoint}
                unit={room.unit}
              />

              <RoomStructure
                wallSequences={room.wallSequences}
                doors={room.doors}
                unit={room.unit}
                selectedEntityId={state.selectedEntityId}
                selectedEntityType={state.selectedEntityType}
                onWallSelect={handleWallClickForDoorPlacement}
                onDoorSelect={handleDoorSelect}
                onDoorDragStart={handleDoorDragStart}
                onDoorDragEnd={handleDoorDragEnd}
                onNewWallClick={handleNewWallFromEndpoint}
                onWallSequenceDragStart={handleWallSequenceDragStart}
                onWallSequenceDragEnd={handleWallSequenceDragEnd}
                isDragging={canvasInteraction.isDragging}
                onButtonMouseEnter={() => wallPlacement.setIsOverButton(true)}
                onButtonMouseLeave={() => wallPlacement.setIsOverButton(false)}
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
                  onSelect={() => handleFurnitureSelect(furniture.id)}
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
          </>
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

      <PropertiesFloatingCard />
    </div>
  );
}
