import { useState } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { IWallSequence, IWallGeometry, IDoor, Unit } from '../../types';
import { pointToPixels, fromPixels } from '../../utils/canvas';
import { Wall } from './Wall';
import { Door } from './Door';

interface IProps {
  sequence: IWallSequence;
  wallGeometries: Map<string, IWallGeometry>;
  doors: IDoor[];
  unit: Unit;
  isSelected: boolean;
  selectedEntityId: string | null;
  selectedEntityType: 'wall' | 'door' | 'furniture' | 'wallSequence' | null;
  hoveredWallId: string | null;
  wallsWithFreeStart: Set<string>;
  wallsWithFreeEnd: Set<string>;
  onWallSelect: (
    wallId: string,
    e: Konva.KonvaEventObject<MouseEvent>,
    isDragging: boolean
  ) => void;
  onDoorSelect: (doorId: string) => void;
  onNewWallClick: (wallId: string, endpoint: 'start' | 'end', angle: number) => void;
  onMouseEnter: (wallId: string) => void;
  onMouseLeave: () => void;
  onDragStart: () => void;
  onDragEnd: (sequenceId: string, x: number, y: number) => void;
  isDragging: boolean;
}

export function WallSequence({
  sequence,
  wallGeometries,
  doors,
  unit,
  isSelected,
  selectedEntityId,
  selectedEntityType,
  hoveredWallId,
  wallsWithFreeStart,
  wallsWithFreeEnd,
  onWallSelect,
  onDoorSelect,
  onNewWallClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
  isDragging,
}: IProps) {
  const [isDraggingSequence, setIsDraggingSequence] = useState(false);
  const positionPixels = pointToPixels(sequence.position, unit);

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSelected) return;
    e.cancelBubble = true;
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'grabbing';
    setIsDraggingSequence(true);
    onDragStart();
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSelected) return;
    e.cancelBubble = true;
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSelected) return;
    e.cancelBubble = true;
    const node = e.target;
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'default';
    setIsDraggingSequence(false);
    onDragEnd(sequence.id, fromPixels(node.x(), unit), fromPixels(node.y(), unit));
  };

  const sequenceWallGeometries = sequence.walls
    .map((wall) => wallGeometries.get(wall.id))
    .filter((geometry): geometry is IWallGeometry => geometry !== undefined);

  const sequenceWallIds = new Set(sequence.walls.map((wall) => wall.id));
  const sequenceDoors = doors.filter((door) => sequenceWallIds.has(door.wallId));

  return (
    <Group
      x={positionPixels.x}
      y={positionPixels.y}
      draggable={isSelected}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {sequenceWallGeometries.map((geometry) => {
        const relativeGeometry = {
          ...geometry,
          startPoint: {
            x: geometry.startPoint.x - sequence.position.x,
            y: geometry.startPoint.y - sequence.position.y,
          },
          endPoint: {
            x: geometry.endPoint.x - sequence.position.x,
            y: geometry.endPoint.y - sequence.position.y,
          },
        };

        const isIndividuallySelected =
          !hoveredWallId && selectedEntityId === geometry.id && selectedEntityType === 'wall';
        const isPartOfSelectedSequence = isSelected;
        const isWallSelected = isIndividuallySelected || isPartOfSelectedSequence;

        return (
          <Wall
            key={geometry.id}
            geometry={relativeGeometry}
            unit={unit}
            isSelected={isWallSelected}
            isHovered={hoveredWallId === geometry.id}
            hasStartFree={
              selectedEntityType !== 'wallSequence' && wallsWithFreeStart.has(geometry.id)
            }
            hasEndFree={selectedEntityType !== 'wallSequence' && wallsWithFreeEnd.has(geometry.id)}
            onSelect={(e) => onWallSelect(geometry.id, e, isDragging || isDraggingSequence)}
            onMouseEnter={() => onMouseEnter(geometry.id)}
            onMouseLeave={onMouseLeave}
            onNewWallClick={(endpoint, angle) => onNewWallClick(geometry.id, endpoint, angle)}
          />
        );
      })}

      {sequenceDoors.map((door) => {
        const wallGeometry = wallGeometries.get(door.wallId);
        if (!wallGeometry) return null;

        const relativeGeometry = {
          ...wallGeometry,
          startPoint: {
            x: wallGeometry.startPoint.x - sequence.position.x,
            y: wallGeometry.startPoint.y - sequence.position.y,
          },
          endPoint: {
            x: wallGeometry.endPoint.x - sequence.position.x,
            y: wallGeometry.endPoint.y - sequence.position.y,
          },
        };

        return (
          <Door
            key={door.id}
            door={door}
            wallGeometry={relativeGeometry}
            unit={unit}
            isSelected={selectedEntityId === door.id && selectedEntityType === 'door'}
            onSelect={() => onDoorSelect(door.id)}
          />
        );
      })}
    </Group>
  );
}
