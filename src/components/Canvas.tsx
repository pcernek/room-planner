import React, { useState, useMemo, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useRoom } from '../store/RoomContext';
import { calculateWallGeometries } from '../utils/geometry';
import { IWall, Unit } from '../types';
import { WallComponent } from './canvas/WallComponent';
import { DoorComponent } from './canvas/DoorComponent';
import { FurnitureComponent } from './canvas/FurnitureComponent';
import { EndpointComponent } from './canvas/EndpointComponent';
import { ArrowButtonKonva } from './canvas/ArrowButtonKonva';
import { WallLengthModal } from './WallLengthModal';

const PIXELS_PER_CM = 2;
const ARROW_BUTTON_SIZE = 40;
const ARROW_BUTTON_DISTANCE = 50;

export function Canvas() {
  const { state, dispatch } = useRoom();
  const stageRef = useRef<Konva.Stage>(null);
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [hoveredEndpoint, setHoveredEndpoint] = useState<{ wallId: string; isEnd: boolean } | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ wallId: string; isEnd: boolean } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingWallAngle, setPendingWallAngle] = useState<number>(0);
  const [pendingPreviousWallId, setPendingPreviousWallId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const wallGeometries = useMemo(
    () => calculateWallGeometries(state.room.walls, state.room.originWallId),
    [state.room.walls, state.room.originWallId]
  );

  const freeEndpoints = useMemo(() => {
    const free = new Set<string>();
    const connected = new Set<string>();

    state.room.walls.forEach(wall => {
      if (wall.previousWallId) {
        connected.add(`${wall.previousWallId}-end`);
      }
    });

    wallGeometries.forEach((geometry) => {
      const startKey = `${geometry.id}-start`;
      const endKey = `${geometry.id}-end`;

      if (!connected.has(startKey)) {
        free.add(startKey);
      }
      if (!connected.has(endKey)) {
        free.add(endKey);
      }
    });

    return free;
  }, [state.room.walls, wallGeometries]);

  function getArrowButtonPositions() {
    if (!selectedEndpoint) return [];

    const wall = wallGeometries.get(selectedEndpoint.wallId);
    if (!wall) return [];

    const point = selectedEndpoint.isEnd ? wall.endPoint : wall.startPoint;
    const wallAngle = wall.angle;

    const perpendicularAngle1 = wallAngle + 90;
    const perpendicularAngle2 = wallAngle - 90;

    const buttons = [];

    for (const angle of [perpendicularAngle1, perpendicularAngle2]) {
      const angleRad = (angle * Math.PI) / 180;
      const centerX = point.x + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.cos(angleRad);
      const centerY = point.y + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.sin(angleRad);

      buttons.push({
        x: centerX * PIXELS_PER_CM,
        y: centerY * PIXELS_PER_CM,
        angle,
        wallAngle: angle
      });
    }

    return buttons;
  }

  function handleWallSelect(wallId: string) {
    setSelectedEndpoint(null);
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: wallId, entityType: 'wall' },
    });
  }

  function handleDoorSelect(doorId: string) {
    setSelectedEndpoint(null);
    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: doorId, entityType: 'door' },
    });
  }

  function handleFurnitureSelect(furnitureId: string) {
    setSelectedEndpoint(null);
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

  function handleEndpointClick(wallId: string, isEnd: boolean) {
    setSelectedEndpoint({ wallId, isEnd });
  }

  function handleModalConfirm(length: number, unit: Unit) {
    if (!pendingPreviousWallId) return;

    const newWall: IWall = {
      id: `wall-${Date.now()}-${Math.random()}`,
      length,
      angle: pendingWallAngle,
      previousWallId: pendingPreviousWallId,
      unit,
    };

    dispatch({ type: 'ADD_WALL', payload: newWall });

    setIsModalOpen(false);
    setSelectedEndpoint(null);
    setPendingWallAngle(0);
    setPendingPreviousWallId(null);

    dispatch({
      type: 'SET_SELECTED_ENTITY',
      payload: { id: newWall.id, entityType: 'wall' },
    });
  }

  function handleModalCancel() {
    setIsModalOpen(false);
    setPendingWallAngle(0);
    setPendingPreviousWallId(null);
  }

  function handleArrowButtonClick(angle: number) {
    if (!selectedEndpoint) return;
    setPendingWallAngle(angle);
    setPendingPreviousWallId(selectedEndpoint.wallId);
    setIsModalOpen(true);
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target === e.target.getStage()) {
      setSelectedEndpoint(null);
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
    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
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

  const arrowButtonPositions = getArrowButtonPositions();
  const selectedWall = state.selectedEntityType === 'wall' && state.selectedEntityId
    ? wallGeometries.get(state.selectedEntityId)
    : null;

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
            <WallComponent
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
              <DoorComponent
                key={door.id}
                door={door}
                wallGeometry={wallGeometry}
                isSelected={state.selectedEntityId === door.id && state.selectedEntityType === 'door'}
                onSelect={() => handleDoorSelect(door.id)}
              />
            );
          })}

          {state.room.furniture.map((furniture) => (
            <FurnitureComponent
              key={furniture.id}
              furniture={furniture}
              isSelected={state.selectedEntityId === furniture.id && state.selectedEntityType === 'furniture'}
              onSelect={() => handleFurnitureSelect(furniture.id)}
              onDragEnd={(x, y) => handleFurnitureDrag(furniture.id, x, y)}
            />
          ))}

          {Array.from(wallGeometries.values()).map((geometry) => (
            <React.Fragment key={`endpoints-${geometry.id}`}>
              <EndpointComponent
                point={geometry.startPoint}
                isHovered={hoveredEndpoint?.wallId === geometry.id && !hoveredEndpoint.isEnd}
                onMouseEnter={() => setHoveredEndpoint({ wallId: geometry.id, isEnd: false })}
                onMouseLeave={() => setHoveredEndpoint(null)}
              />
              <EndpointComponent
                point={geometry.endPoint}
                isHovered={hoveredEndpoint?.wallId === geometry.id && hoveredEndpoint.isEnd}
                onMouseEnter={() => setHoveredEndpoint({ wallId: geometry.id, isEnd: true })}
                onMouseLeave={() => setHoveredEndpoint(null)}
              />
            </React.Fragment>
          ))}

          {selectedWall && (
            <>
              {freeEndpoints.has(`${selectedWall.id}-start`) && (
                <EndpointComponent
                  point={selectedWall.startPoint}
                  isFree
                  isSelected={selectedEndpoint?.wallId === selectedWall.id && !selectedEndpoint.isEnd}
                  onClick={() => handleEndpointClick(selectedWall.id, false)}
                />
              )}
              {freeEndpoints.has(`${selectedWall.id}-end`) && (
                <EndpointComponent
                  point={selectedWall.endPoint}
                  isFree
                  isSelected={selectedEndpoint?.wallId === selectedWall.id && selectedEndpoint.isEnd}
                  onClick={() => handleEndpointClick(selectedWall.id, true)}
                />
              )}
            </>
          )}

          {arrowButtonPositions.map((button, index) => (
            <ArrowButtonKonva
              key={index}
              x={button.x}
              y={button.y}
              angle={button.wallAngle}
              size={ARROW_BUTTON_SIZE}
              onClick={() => handleArrowButtonClick(button.angle)}
            />
          ))}
        </Layer>
      </Stage>

      <WallLengthModal
        isOpen={isModalOpen}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
