import { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useRoom } from '../store/RoomContext';
import { useEditor } from '../store/EditorContext';
import { calculateWallGeometries } from '../utils/geometry';
import { INewWall, Unit } from '../types';
import { Wall } from './canvas/Wall';
import { Door } from './canvas/Door';
import { Furniture } from './canvas/Furniture';
import { NewWallModal } from './NewWallModal';

export function Canvas() {
  const { state, dispatch } = useRoom();
  const { state: editorState, setCanvasDimensions, setViewport } = useEditor();
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingWallAngle, setPendingWallAngle] = useState<number>(0);
  const [pendingFromNode, setPendingFromNode] = useState<{ wallId: string; endpoint: 'start' | 'end' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (state.room.walls.length === 0 && !isModalOpen) {
      setIsModalOpen(true);
      setPendingWallAngle(0);
      setPendingFromNode(null);
    }
  }, [state.room.walls.length, isModalOpen]);

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

  const wallGeometries = useMemo(
    () => calculateWallGeometries(state.room.walls, state.room.originWallId),
    [state.room.walls, state.room.originWallId]
  );

  const [firstWallId, lastWallId] = useMemo(() => {
    if (state.room.walls.length === 0) {
      return [null, null];
    }

    const firstWall = state.room.walls[0]
    const lastWall = state.room.walls[state.room.walls.length - 1];
    return [firstWall?.id, lastWall?.id];
  }, [state.room.walls.length]);

  function handleWallSelect(wallId: string) {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: wallId, entityType: 'wall' },
    });
  }

  function handleDoorSelect(doorId: string) {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: doorId, entityType: 'door' },
    });
  }

  function handleFurnitureSelect(furnitureId: string) {
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: furnitureId, entityType: 'furniture' },
    });
  }

  function handleFurnitureDrag(furnitureId: string, x: number, y: number) {
    dispatch({
      type: 'UPDATE_FURNITURE',
      payload: {
        id: furnitureId,
        updates: { position: { x, y } },
      },
    });
  }

  function handleModalConfirm(length: number, unit: Unit) {
    const newWall: INewWall = {
      length,
      unit,
      angle: pendingWallAngle,
      fromNode: pendingFromNode,
    };

    dispatch({ type: 'ADD_WALL', payload: newWall });

    setIsModalOpen(false);
    setPendingWallAngle(0);
    setPendingFromNode(null);
  }

  function handleModalCancel() {
    if (state.room.walls.length > 0) {
      setIsModalOpen(false);
      setPendingWallAngle(0);
      setPendingFromNode(null);
    }
  }

  function handleNewWallClick(wallId: string, endpoint: 'start' | 'end', angle: number) {
    setPendingWallAngle(angle);
    setPendingFromNode({ wallId, endpoint });
    setIsModalOpen(true);
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target === e.target.getStage()) {
      dispatch({
        type: 'SET_SELECTED_ENTITY',
        payload: { id: null, entityType: null },
      });
    }
  }

  function handleStageDragStart() {
    setIsDragging(true);
  }

  function handleStageDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    setIsDragging(false);
    const stage = e.target as Konva.Stage;
    setViewport({
      offsetX: stage.x(),
      offsetY: stage.y(),
    });
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.1, Math.min(5, editorState.viewport.scale * delta));
    setViewport({ scale: newScale });
  }

  function handleWallClick(wallId: string, e: Konva.KonvaEventObject<MouseEvent>) {
    e.cancelBubble = true;
    if (!isDragging) {
      handleWallSelect(wallId);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Stage
        ref={stageRef}
        width={editorState.canvasDimensions.width}
        height={editorState.canvasDimensions.height}
        draggable
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
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
              isSelected={!hoveredWallId && state.selectedEntityId === geometry.id && state.selectedEntityType === 'wall'}
              isHovered={hoveredWallId === geometry.id}
              hasStartFree={geometry.id === firstWallId}
              hasEndFree={geometry.id === lastWallId}
              onSelect={(e) => handleWallClick(geometry.id, e)}
              onMouseEnter={() => setHoveredWallId(geometry.id)}
              onMouseLeave={() => setHoveredWallId(null)}
              onNewWallClick={(endpoint, angle) => handleNewWallClick(geometry.id, endpoint, angle)}
            />
          ))}

          {state.room.doors.map((door) => {
            const wallGeometry = wallGeometries.get(door.wallId);
            if (!wallGeometry) return null;
            return (
              <Door
                key={door.id}
                door={door}
                wallGeometry={wallGeometry}
                isSelected={state.selectedEntityId === door.id && state.selectedEntityType === 'door'}
                onSelect={() => handleDoorSelect(door.id)}
              />
            );
          })}

          {state.room.furniture.map((furniture) => (
            <Furniture
              key={furniture.id}
              furniture={furniture}
              isSelected={state.selectedEntityId === furniture.id && state.selectedEntityType === 'furniture'}
              onSelect={() => handleFurnitureSelect(furniture.id)}
              onDragEnd={(x, y) => handleFurnitureDrag(furniture.id, x, y)}
            />
          ))}
        </Layer>
      </Stage>

      <NewWallModal
        isOpen={isModalOpen}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
