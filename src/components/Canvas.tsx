import React, { useRef, useEffect, useState } from 'react';
import { useRoom } from '../store/RoomContext';
import { calculateWallGeometries, distance, isPointNearLine } from '../utils/geometry';
import { IPoint, IWallGeometry, IWall, Unit } from '../types';
import { toCm } from '../utils/units';
import { WallLengthModal } from './WallLengthModal';
import { ArrowButton } from './ArrowButton';

const PIXELS_PER_CM = 2;
const WALL_THICKNESS = 8;
const DOOR_COLOR = '#8B4513';
const WALL_COLOR = '#333';
const FURNITURE_COLOR = '#4A90E2';
const ENDPOINT_RADIUS = 8;
const FREE_ENDPOINT_RADIUS = 12;
const ARROW_BUTTON_SIZE = 40;
const ARROW_BUTTON_DISTANCE = 50;
const SELECTION_COLOR = '#FF6B6B';

export function Canvas() {
  const { state, dispatch } = useRoom();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<IPoint | null>(null);
  const [draggingFurnitureId, setDraggingFurnitureId] = useState<string | null>(null);
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [hoveredEndpoint, setHoveredEndpoint] = useState<{ wallId: string; isEnd: boolean } | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ wallId: string; isEnd: boolean } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingWallAngle, setPendingWallAngle] = useState<number>(0);
  const [pendingPreviousWallId, setPendingPreviousWallId] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(state.viewport.offsetX, state.viewport.offsetY);
    ctx.scale(state.viewport.scale, state.viewport.scale);

    const wallGeometries = calculateWallGeometries(state.room.walls, state.room.originWallId);
    const freeEndpoints = getFreeEndpoints(wallGeometries);

    drawWalls(ctx, wallGeometries);
    drawDoors(ctx, state.room.doors, wallGeometries);
    drawFurniture(ctx);
    drawEndpoints(ctx, wallGeometries);

    if (state.selectedEntityType === 'wall' && state.selectedEntityId) {
      drawFreeEndpoints(ctx, wallGeometries, freeEndpoints);
    }

    ctx.restore();
  }, [state.room, state.viewport, state.selectedEntityId, state.selectedEntityType, hoveredWallId, hoveredEndpoint, selectedEndpoint]);

  function drawWalls(ctx: CanvasRenderingContext2D, wallGeometries: Map<string, IWallGeometry>) {
    wallGeometries.forEach((geometry) => {
      const isSelected = state.selectedEntityId === geometry.id && state.selectedEntityType === 'wall';
      const isHovered = hoveredWallId === geometry.id;

      ctx.strokeStyle = isSelected ? SELECTION_COLOR : isHovered ? '#555' : WALL_COLOR;
      ctx.lineWidth = WALL_THICKNESS;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(geometry.startPoint.x * PIXELS_PER_CM, geometry.startPoint.y * PIXELS_PER_CM);
      ctx.lineTo(geometry.endPoint.x * PIXELS_PER_CM, geometry.endPoint.y * PIXELS_PER_CM);
      ctx.stroke();
    });
  }

  function drawDoors(ctx: CanvasRenderingContext2D, doors: typeof state.room.doors, wallGeometries: Map<string, IWallGeometry>) {
    doors.forEach((door) => {
      const wallGeometry = wallGeometries.get(door.wallId);
      if (!wallGeometry) return;

      const offsetInCm = toCm(door.offsetFromStart, door.unit);
      const widthInCm = toCm(door.width, door.unit);

      const dx = wallGeometry.endPoint.x - wallGeometry.startPoint.x;
      const dy = wallGeometry.endPoint.y - wallGeometry.startPoint.y;
      const wallLength = Math.sqrt(dx * dx + dy * dy);

      if (wallLength === 0) return;

      const t = offsetInCm / wallLength;
      const doorStart = {
        x: wallGeometry.startPoint.x + t * dx,
        y: wallGeometry.startPoint.y + t * dy,
      };

      const t2 = (offsetInCm + widthInCm) / wallLength;
      const doorEnd = {
        x: wallGeometry.startPoint.x + t2 * dx,
        y: wallGeometry.startPoint.y + t2 * dy,
      };

      const isSelected = state.selectedEntityId === door.id && state.selectedEntityType === 'door';

      ctx.strokeStyle = isSelected ? SELECTION_COLOR : DOOR_COLOR;
      ctx.lineWidth = WALL_THICKNESS;
      ctx.lineCap = 'butt';

      ctx.beginPath();
      ctx.moveTo(doorStart.x * PIXELS_PER_CM, doorStart.y * PIXELS_PER_CM);
      ctx.lineTo(doorEnd.x * PIXELS_PER_CM, doorEnd.y * PIXELS_PER_CM);
      ctx.stroke();

      const arcCenter = doorEnd;
      const arcRadius = widthInCm;
      const startAngle = Math.atan2(dy, dx);
      const endAngle = startAngle + Math.PI / 2;

      ctx.strokeStyle = isSelected ? SELECTION_COLOR : '#DDD';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        arcCenter.x * PIXELS_PER_CM,
        arcCenter.y * PIXELS_PER_CM,
        arcRadius * PIXELS_PER_CM,
        startAngle,
        endAngle
      );
      ctx.stroke();
    });
  }

  function drawFurniture(ctx: CanvasRenderingContext2D) {
    state.room.furniture.forEach((furniture) => {
      const widthInCm = toCm(furniture.width, furniture.unit);
      const heightInCm = toCm(furniture.height, furniture.unit);
      const isSelected = state.selectedEntityId === furniture.id && state.selectedEntityType === 'furniture';

      ctx.save();
      ctx.translate(furniture.position.x * PIXELS_PER_CM, furniture.position.y * PIXELS_PER_CM);
      ctx.rotate((furniture.rotation * Math.PI) / 180);

      ctx.fillStyle = isSelected ? SELECTION_COLOR : FURNITURE_COLOR;
      ctx.fillRect(0, 0, widthInCm * PIXELS_PER_CM, heightInCm * PIXELS_PER_CM);

      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, widthInCm * PIXELS_PER_CM, heightInCm * PIXELS_PER_CM);

      ctx.fillStyle = '#FFF';
      ctx.font = '12px sans-serif';
      ctx.fillText(furniture.name, 5, 15);

      ctx.restore();
    });
  }

  function getFreeEndpoints(wallGeometries: Map<string, IWallGeometry>): Set<string> {
    const freeEndpoints = new Set<string>();
    const connectedEndpoints = new Set<string>();

    state.room.walls.forEach(wall => {
      if (wall.previousWallId) {
        connectedEndpoints.add(`${wall.previousWallId}-end`);
      }
    });

    wallGeometries.forEach((geometry) => {
      const startKey = `${geometry.id}-start`;
      const endKey = `${geometry.id}-end`;

      if (!connectedEndpoints.has(startKey)) {
        freeEndpoints.add(startKey);
      }
      if (!connectedEndpoints.has(endKey)) {
        freeEndpoints.add(endKey);
      }
    });

    return freeEndpoints;
  }

  function drawFreeEndpoints(ctx: CanvasRenderingContext2D, wallGeometries: Map<string, IWallGeometry>, freeEndpoints: Set<string>) {
    const selectedWall = wallGeometries.get(state.selectedEntityId!);
    if (!selectedWall) return;

    const drawFreeEndpoint = (wallId: string, point: IPoint, isEnd: boolean) => {
      const key = `${wallId}-${isEnd ? 'end' : 'start'}`;
      if (!freeEndpoints.has(key)) return;

      const isSelected = selectedEndpoint?.wallId === wallId && selectedEndpoint?.isEnd === isEnd;

      ctx.strokeStyle = isSelected ? SELECTION_COLOR : '#4A90E2';
      ctx.fillStyle = isSelected ? SELECTION_COLOR : '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x * PIXELS_PER_CM, point.y * PIXELS_PER_CM, FREE_ENDPOINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    drawFreeEndpoint(selectedWall.id, selectedWall.startPoint, false);
    drawFreeEndpoint(selectedWall.id, selectedWall.endPoint, true);
  }

  function drawEndpoints(ctx: CanvasRenderingContext2D, wallGeometries: Map<string, IWallGeometry>) {
    wallGeometries.forEach((geometry) => {
      const drawEndpoint = (point: IPoint, isEnd: boolean) => {
        const isHovered = hoveredEndpoint?.wallId === geometry.id && hoveredEndpoint?.isEnd === isEnd;

        ctx.fillStyle = isHovered ? SELECTION_COLOR : '#666';
        ctx.beginPath();
        ctx.arc(point.x * PIXELS_PER_CM, point.y * PIXELS_PER_CM, ENDPOINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      };

      drawEndpoint(geometry.startPoint, false);
      drawEndpoint(geometry.endPoint, true);
    });
  }

  function screenToWorld(screenX: number, screenY: number): IPoint {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - state.viewport.offsetX) / state.viewport.scale / PIXELS_PER_CM;
    const y = (screenY - rect.top - state.viewport.offsetY) / state.viewport.scale / PIXELS_PER_CM;
    return { x, y };
  }

  function worldToScreen(worldX: number, worldY: number): IPoint {
    const x = worldX * PIXELS_PER_CM * state.viewport.scale + state.viewport.offsetX;
    const y = worldY * PIXELS_PER_CM * state.viewport.scale + state.viewport.offsetY;
    return { x, y };
  }

  function getArrowButtonPositions(): Array<{ screenX: number; screenY: number; angle: number; wallAngle: number }> {
    if (!selectedEndpoint) return [];

    const wallGeometries = calculateWallGeometries(state.room.walls, state.room.originWallId);
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

      const screenPos = worldToScreen(centerX, centerY);
      buttons.push({ screenX: screenPos.x, screenY: screenPos.y, angle, wallAngle: angle });
    }

    return buttons;
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    const worldPoint = screenToWorld(event.clientX, event.clientY);
    const wallGeometries = calculateWallGeometries(state.room.walls, state.room.originWallId);

    if (state.selectedEntityType === 'wall' && state.selectedEntityId) {
      const freeEndpoints = getFreeEndpoints(wallGeometries);
      const selectedWall = wallGeometries.get(state.selectedEntityId);

      if (selectedWall) {
        const checkFreeEndpoint = (wallId: string, point: IPoint, isEnd: boolean): boolean => {
          const key = `${wallId}-${isEnd ? 'end' : 'start'}`;
          if (!freeEndpoints.has(key)) return false;

          const dist = distance(worldPoint, point);
          return dist < FREE_ENDPOINT_RADIUS / PIXELS_PER_CM;
        };

        if (checkFreeEndpoint(selectedWall.id, selectedWall.startPoint, false)) {
          setSelectedEndpoint({ wallId: selectedWall.id, isEnd: false });
          return;
        }

        if (checkFreeEndpoint(selectedWall.id, selectedWall.endPoint, true)) {
          setSelectedEndpoint({ wallId: selectedWall.id, isEnd: true });
          return;
        }
      }
    }

    const clickedFurniture = state.room.furniture.find((furniture) => {
      const widthInCm = toCm(furniture.width, furniture.unit);
      const heightInCm = toCm(furniture.height, furniture.unit);
      return (
        worldPoint.x >= furniture.position.x &&
        worldPoint.x <= furniture.position.x + widthInCm &&
        worldPoint.y >= furniture.position.y &&
        worldPoint.y <= furniture.position.y + heightInCm
      );
    });

    if (clickedFurniture) {
      setDraggingFurnitureId(clickedFurniture.id);
      setDragStart(worldPoint);
      setSelectedEndpoint(null);
      dispatch({
        type: 'SET_SELECTED_ENTITY',
        payload: { id: clickedFurniture.id, entityType: 'furniture' },
      });
      return;
    }

    for (const geometry of wallGeometries.values()) {
      if (distance(worldPoint, geometry.startPoint) < ENDPOINT_RADIUS / PIXELS_PER_CM) {
        setSelectedEndpoint(null);
        dispatch({
          type: 'SET_SELECTED_ENTITY',
          payload: { id: geometry.id, entityType: 'wall' },
        });
        return;
      }
      if (distance(worldPoint, geometry.endPoint) < ENDPOINT_RADIUS / PIXELS_PER_CM) {
        setSelectedEndpoint(null);
        dispatch({
          type: 'SET_SELECTED_ENTITY',
          payload: { id: geometry.id, entityType: 'wall' },
        });
        return;
      }
    }

    for (const geometry of wallGeometries.values()) {
      if (isPointNearLine(worldPoint, geometry.startPoint, geometry.endPoint, WALL_THICKNESS / PIXELS_PER_CM)) {
        setSelectedEndpoint(null);
        dispatch({
          type: 'SET_SELECTED_ENTITY',
          payload: { id: geometry.id, entityType: 'wall' },
        });
        return;
      }
    }

    if (state.activeTool === 'select') {
      setSelectedEndpoint(null);
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    const worldPoint = screenToWorld(event.clientX, event.clientY);

    if (draggingFurnitureId && dragStart) {
      const furniture = state.room.furniture.find((f) => f.id === draggingFurnitureId);
      if (furniture) {
        const dx = worldPoint.x - dragStart.x;
        const dy = worldPoint.y - dragStart.y;
        dispatch({
          type: 'UPDATE_FURNITURE',
          payload: {
            id: draggingFurnitureId,
            updates: {
              position: {
                x: furniture.position.x + dx,
                y: furniture.position.y + dy,
              },
            },
          },
        });
        setDragStart(worldPoint);
      }
      return;
    }

    if (isDragging && dragStart) {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      dispatch({
        type: 'SET_VIEWPORT',
        payload: {
          offsetX: state.viewport.offsetX + dx,
          offsetY: state.viewport.offsetY + dy,
        },
      });
      setDragStart({ x: event.clientX, y: event.clientY });
      return;
    }

    const wallGeometries = calculateWallGeometries(state.room.walls, state.room.originWallId);

    let foundHoveredEndpoint = false;
    for (const geometry of wallGeometries.values()) {
      if (distance(worldPoint, geometry.startPoint) < ENDPOINT_RADIUS / PIXELS_PER_CM) {
        setHoveredEndpoint({ wallId: geometry.id, isEnd: false });
        foundHoveredEndpoint = true;
        break;
      }
      if (distance(worldPoint, geometry.endPoint) < ENDPOINT_RADIUS / PIXELS_PER_CM) {
        setHoveredEndpoint({ wallId: geometry.id, isEnd: true });
        foundHoveredEndpoint = true;
        break;
      }
    }
    if (!foundHoveredEndpoint) {
      setHoveredEndpoint(null);
    }

    let foundHoveredWall = false;
    for (const geometry of wallGeometries.values()) {
      if (isPointNearLine(worldPoint, geometry.startPoint, geometry.endPoint, WALL_THICKNESS / PIXELS_PER_CM)) {
        setHoveredWallId(geometry.id);
        foundHoveredWall = true;
        break;
      }
    }
    if (!foundHoveredWall) {
      setHoveredWallId(null);
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
    setDragStart(null);
    setDraggingFurnitureId(null);
  }

  function handleWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, state.viewport.scale * delta));
    dispatch({
      type: 'SET_VIEWPORT',
      payload: { scale: newScale },
    });
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

  const arrowButtonPositions = getArrowButtonPositions();

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          border: '1px solid #ddd',
          cursor: isDragging ? 'grabbing' : draggingFurnitureId ? 'move' : 'default',
          backgroundColor: '#fff',
        }}
      />
      {arrowButtonPositions.map((button, index) => (
        <ArrowButton
          key={index}
          centerX={button.screenX}
          centerY={button.screenY}
          angle={button.wallAngle}
          size={ARROW_BUTTON_SIZE}
          onClick={() => handleArrowButtonClick(button.angle)}
        />
      ))}
      <WallLengthModal
        isOpen={isModalOpen}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}

