import { useMemo, useState } from 'react';
import Konva from 'konva';
import { IWallSequence, IDoor, Unit } from '../../types';
import { calculateWallGeometries } from '../../utils/geometry';
import { WallSequence } from './WallSequence';

interface IProps {
  wallSequences: IWallSequence[];
  doors: IDoor[];
  unit: Unit;
  selectedEntityId: string | null;
  selectedEntityType: 'wall' | 'door' | 'furniture' | 'wallSequence' | null;
  onWallSelect: (
    wallId: string,
    e: Konva.KonvaEventObject<MouseEvent>,
    isDragging: boolean
  ) => void;
  onDoorSelect: (doorId: string) => void;
  onDoorDragStart: () => void;
  onDoorDragEnd: (doorId: string, newOffsetFromStart: number) => void;
  onNewWallClick: (wallId: string, endpoint: 'start' | 'end') => void;
  onWallSequenceDragStart: () => void;
  onWallSequenceDragEnd: (sequenceId: string, x: number, y: number) => void;
  isDragging: boolean;
  onButtonMouseEnter?: () => void;
  onButtonMouseLeave?: () => void;
}

export function RoomStructure({
  wallSequences,
  doors,
  unit,
  selectedEntityId,
  selectedEntityType,
  onWallSelect,
  onDoorSelect,
  onDoorDragStart,
  onDoorDragEnd,
  onNewWallClick,
  onWallSequenceDragStart,
  onWallSequenceDragEnd,
  isDragging,
  onButtonMouseEnter,
  onButtonMouseLeave,
}: IProps) {
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);

  const wallGeometries = useMemo(() => calculateWallGeometries(wallSequences), [wallSequences]);

  const wallsWithFreeEndpoints = useMemo(() => {
    if (wallSequences.length === 0) {
      return [new Set<string>(), new Set<string>()] as const;
    }

    const wallsWithFreeStart = new Set<string>();
    const wallsWithFreeEnd = new Set<string>();

    const geometries = Array.from(wallGeometries.values());

    for (const geometry of geometries) {
      let hasStartConnection = false;
      let hasEndConnection = false;

      for (const otherGeometry of geometries) {
        if (geometry.id === otherGeometry.id) continue;

        const threshold = 1;
        if (
          Math.abs(geometry.startPoint.x - otherGeometry.startPoint.x) < threshold &&
          Math.abs(geometry.startPoint.y - otherGeometry.startPoint.y) < threshold
        ) {
          hasStartConnection = true;
        }
        if (
          Math.abs(geometry.startPoint.x - otherGeometry.endPoint.x) < threshold &&
          Math.abs(geometry.startPoint.y - otherGeometry.endPoint.y) < threshold
        ) {
          hasStartConnection = true;
        }
        if (
          Math.abs(geometry.endPoint.x - otherGeometry.startPoint.x) < threshold &&
          Math.abs(geometry.endPoint.y - otherGeometry.startPoint.y) < threshold
        ) {
          hasEndConnection = true;
        }
        if (
          Math.abs(geometry.endPoint.x - otherGeometry.endPoint.x) < threshold &&
          Math.abs(geometry.endPoint.y - otherGeometry.endPoint.y) < threshold
        ) {
          hasEndConnection = true;
        }
      }

      if (!hasStartConnection) {
        wallsWithFreeStart.add(geometry.id);
      }
      if (!hasEndConnection) {
        wallsWithFreeEnd.add(geometry.id);
      }
    }

    return [wallsWithFreeStart, wallsWithFreeEnd] as const;
  }, [wallSequences, wallGeometries]);

  return (
    <>
      {wallSequences.map((sequence) => {
        const isSequenceSelected =
          selectedEntityType === 'wallSequence' && selectedEntityId === sequence.id;

        return (
          <WallSequence
            key={sequence.id}
            sequence={sequence}
            wallGeometries={wallGeometries}
            doors={doors}
            unit={unit}
            isSelected={isSequenceSelected}
            selectedEntityId={selectedEntityId}
            selectedEntityType={selectedEntityType}
            hoveredWallId={hoveredWallId}
            wallsWithFreeStart={wallsWithFreeEndpoints[0]}
            wallsWithFreeEnd={wallsWithFreeEndpoints[1]}
            onWallSelect={onWallSelect}
            onDoorSelect={onDoorSelect}
            onDoorDragStart={onDoorDragStart}
            onDoorDragEnd={onDoorDragEnd}
            onNewWallClick={onNewWallClick}
            onMouseEnter={(wallId) => setHoveredWallId(wallId)}
            onMouseLeave={() => setHoveredWallId(null)}
            onDragStart={onWallSequenceDragStart}
            onDragEnd={onWallSequenceDragEnd}
            isDragging={isDragging}
            onButtonMouseEnter={onButtonMouseEnter}
            onButtonMouseLeave={onButtonMouseLeave}
          />
        );
      })}
    </>
  );
}
