import { useMemo, useState } from 'react';
import Konva from 'konva';
import { IWallSequence, IDoor, Unit } from '../../types';
import { calculateWallGeometries } from '../../utils/geometry';
import { Wall } from './Wall';
import { Door } from './Door';

interface IProps {
  wallSequences: IWallSequence[];
  doors: IDoor[];
  unit: Unit;
  selectedEntityId: string | null;
  selectedEntityType: 'wall' | 'door' | 'furniture' | null;
  onWallSelect: (
    wallId: string,
    e: Konva.KonvaEventObject<MouseEvent>,
    isDragging: boolean
  ) => void;
  onDoorSelect: (doorId: string) => void;
  onNewWallClick: (wallId: string, endpoint: 'start' | 'end', angle: number) => void;
  isDragging: boolean;
}

export function RoomStructure({
  wallSequences,
  doors,
  unit,
  selectedEntityId,
  selectedEntityType,
  onWallSelect,
  onDoorSelect,
  onNewWallClick,
  isDragging,
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
      {Array.from(wallGeometries.values()).map((geometry) => (
        <Wall
          key={geometry.id}
          geometry={geometry}
          unit={unit}
          isSelected={
            !hoveredWallId && selectedEntityId === geometry.id && selectedEntityType === 'wall'
          }
          isHovered={hoveredWallId === geometry.id}
          hasStartFree={wallsWithFreeEndpoints[0].has(geometry.id)}
          hasEndFree={wallsWithFreeEndpoints[1].has(geometry.id)}
          onSelect={(e) => onWallSelect(geometry.id, e, isDragging)}
          onMouseEnter={() => setHoveredWallId(geometry.id)}
          onMouseLeave={() => setHoveredWallId(null)}
          onNewWallClick={(endpoint, angle) => onNewWallClick(geometry.id, endpoint, angle)}
        />
      ))}

      {doors.map((door) => {
        const wallGeometry = wallGeometries.get(door.wallId);
        if (!wallGeometry) return null;
        return (
          <Door
            key={door.id}
            door={door}
            wallGeometry={wallGeometry}
            unit={unit}
            isSelected={selectedEntityId === door.id && selectedEntityType === 'door'}
            onSelect={() => onDoorSelect(door.id)}
          />
        );
      })}
    </>
  );
}
