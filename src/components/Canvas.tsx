import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useRoom } from '../store/RoomContext';
import { calculateWallGeometries } from '../utils/geometry';
import { INewWall, Unit } from '../types';
import { Wall } from './canvas/Wall';
import { Door } from './canvas/Door';
import { Furniture } from './canvas/Furniture';
import { Endpoint } from './canvas/Endpoint';
import { NewWallButton } from './canvas/NewWallButton';
import { NewWallModal } from './NewWallModal';

const PIXELS_PER_CM = 2;
const ARROW_BUTTON_SIZE = 40;
const ARROW_BUTTON_DISTANCE = 50;

export function Canvas() {
  const { state, dispatch } = useRoom();
  const stageRef = useRef<Konva.Stage>(null);
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

  function getNewWallButtonPositions() {
    const activeWallId = state.selectedEntityType === 'wall' && state.selectedEntityId
      ? state.selectedEntityId
      : hoveredWallId;

    if (!activeWallId) return [];

    const wall = wallGeometries.get(activeWallId);
    if (!wall) return [];

    const wallAngle = wall.angle;
    const perpendicularAngle1 = wallAngle + 90;
    const perpendicularAngle2 = wallAngle - 90;

    const buttons: Array<{ x: number; y: number; angle: number; wallAngle: number; wallId: string; isEnd: boolean }> = [];

    if (activeWallId === firstWallId) {
      for (const angle of [perpendicularAngle1, perpendicularAngle2]) {
        const angleRad = (angle * Math.PI) / 180;
        const centerX = wall.startPoint.x + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.cos(angleRad);
        const centerY = wall.startPoint.y + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.sin(angleRad);

        buttons.push({
          x: centerX * PIXELS_PER_CM,
          y: centerY * PIXELS_PER_CM,
          angle,
          wallAngle: angle,
          wallId: activeWallId,
          isEnd: false,
        });
      }
    }

    if (activeWallId === lastWallId) {
      for (const angle of [perpendicularAngle1, perpendicularAngle2]) {
        const angleRad = (angle * Math.PI) / 180;
        const centerX = wall.endPoint.x + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.cos(angleRad);
        const centerY = wall.endPoint.y + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.sin(angleRad);

        buttons.push({
          x: centerX * PIXELS_PER_CM,
          y: centerY * PIXELS_PER_CM,
          angle,
          wallAngle: angle,
          wallId: activeWallId,
          isEnd: true,
        });
      }
    }

    return buttons;
  }

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

  function handleNewWallButtonClick(wallId: string, endpoint: 'start' | 'end', angle: number) {
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
    dispatch({
      type: 'SET_VIEWPORT',
      payload: {
        offsetX: stage.x(),
        offsetY: stage.y(),
      },
    });
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.1, Math.min(5, state.viewport.scale * delta));
    dispatch({
      type: 'SET_VIEWPORT',
      payload: { scale: newScale },
    });
  }

  function handleWallClick(wallId: string, e: Konva.KonvaEventObject<MouseEvent>) {
    e.cancelBubble = true;
    if (!isDragging) {
      handleWallSelect(wallId);
    }
  }

  const NewWallButtonPositions = getNewWallButtonPositions();

  const activeWallId = state.selectedEntityType === 'wall' && state.selectedEntityId
    ? state.selectedEntityId
    : hoveredWallId;
  const activeWall = activeWallId ? wallGeometries.get(activeWallId) : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Stage
        ref={stageRef}
        width={1200}
        height={800}
        draggable
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        x={state.viewport.offsetX}
        y={state.viewport.offsetY}
        scaleX={state.viewport.scale}
        scaleY={state.viewport.scale}
        style={{ border: '1px solid #ddd', backgroundColor: '#fff' }}
      >
        <Layer>
          {Array.from(wallGeometries.values()).map((geometry) => (
            <Wall
              key={geometry.id}
              geometry={geometry}
              isSelected={state.selectedEntityId === geometry.id && state.selectedEntityType === 'wall'}
              isHovered={hoveredWallId === geometry.id}
              onSelect={(e) => handleWallClick(geometry.id, e)}
              onMouseEnter={() => setHoveredWallId(geometry.id)}
              onMouseLeave={() => setHoveredWallId(null)}
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

          {Array.from(wallGeometries.values()).map((geometry) => (
            <React.Fragment key={`endpoints-${geometry.id}`}>
              <Endpoint point={geometry.startPoint} />
              <Endpoint point={geometry.endPoint} />
            </React.Fragment>
          ))}

          {activeWall && (
            <>
              {activeWallId === firstWallId && (
                <Endpoint point={activeWall.startPoint} isFree />
              )}
              {activeWallId === lastWallId && (
                <Endpoint point={activeWall.endPoint} isFree />
              )}
            </>
          )}

          {NewWallButtonPositions.map((button, index) => (
            <NewWallButton
              key={index}
              x={button.x}
              y={button.y}
              angle={button.wallAngle}
              size={ARROW_BUTTON_SIZE}
              onClick={() => handleNewWallButtonClick(button.wallId, button.isEnd ? 'end' : 'start', button.angle)}
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
