import { Line, Group } from 'react-konva';
import Konva from 'konva';
import { IWallGeometry, Unit } from '../../types';
import { Endpoint } from './Endpoint';
import { NewWallButton } from './NewWallButton';
import { toPixels, pointToPixels, fromPixels } from '../../utils/canvas';

const WALL_THICKNESS_CM = 8;
const WALL_COLOR = '#333';
const HOVER_COLOR = '#FF6B6B';
const SELECTION_COLOR = '#FF6B6B';
const ARROW_BUTTON_SIZE = 40;
const ARROW_BUTTON_DISTANCE_PX = 50;

interface IProps {
  geometry: IWallGeometry;
  unit: Unit;
  isSelected: boolean;
  isHovered: boolean;
  hasStartFree: boolean;
  hasEndFree: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNewWallClick: (endpoint: 'start' | 'end', angle: number) => void;
}

export function Wall({
  geometry,
  unit,
  isSelected,
  isHovered,
  hasStartFree,
  hasEndFree,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onNewWallClick
}: IProps) {
  const isActive = isSelected || isHovered;
  const wallAngle = geometry.angle;
  const perpendicularAngle1 = wallAngle + 90;
  const perpendicularAngle2 = wallAngle - 90;

  const wallThickness = WALL_THICKNESS_CM / 2; // constant wall thickness
  const startPixels = pointToPixels(geometry.startPoint, unit);
  const endPixels = pointToPixels(geometry.endPoint, unit);

  return (
    <Group>
      <Line
        points={[
          startPixels.x,
          startPixels.y,
          endPixels.x,
          endPixels.y,
        ]}
        stroke={isSelected ? SELECTION_COLOR : isHovered ? HOVER_COLOR : WALL_COLOR}
        strokeWidth={wallThickness}
        lineCap="round"
        lineJoin="round"
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
          onMouseEnter();
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'move';
          onMouseLeave();
        }}
      />

      <Endpoint
        point={geometry.startPoint}
        unit={unit}
        isFree={isActive && hasStartFree}
        onMouseEnter={hasStartFree ? onMouseEnter : undefined}
        onMouseLeave={hasStartFree ? onMouseLeave : undefined}
        onSelect={hasStartFree ? onSelect : undefined}
      />
      <Endpoint
        point={geometry.endPoint}
        unit={unit}
        isFree={isActive && hasEndFree}
        onMouseEnter={hasEndFree ? onMouseEnter : undefined}
        onMouseLeave={hasEndFree ? onMouseLeave : undefined}
        onSelect={hasEndFree ? onSelect : undefined}
      />

      {isActive && hasStartFree && (
        <>
          {[perpendicularAngle1, perpendicularAngle2].map((angle) => {
            const angleRad = (angle * Math.PI) / 180;
            const centerX = geometry.startPoint.x + (fromPixels(ARROW_BUTTON_DISTANCE_PX, unit)) * Math.cos(angleRad);
            const centerY = geometry.startPoint.y + (fromPixels(ARROW_BUTTON_DISTANCE_PX, unit)) * Math.sin(angleRad);

            return (
              <NewWallButton
                key={`start-${angle}`}
                x={toPixels(centerX, unit)}
                y={toPixels(centerY, unit)}
                angle={angle}
                size={ARROW_BUTTON_SIZE}
                onClick={() => onNewWallClick('start', angle)}
              />
            );
          })}
        </>
      )}

      {isActive && hasEndFree && (
        <>
          {[perpendicularAngle1, perpendicularAngle2].map((angle) => {
            const angleRad = (angle * Math.PI) / 180;
            const centerX = geometry.endPoint.x + (fromPixels(ARROW_BUTTON_DISTANCE_PX, unit)) * Math.cos(angleRad);
            const centerY = geometry.endPoint.y + (fromPixels(ARROW_BUTTON_DISTANCE_PX, unit)) * Math.sin(angleRad);

            return (
              <NewWallButton
                key={`end-${angle}`}
                x={toPixels(centerX, unit)}
                y={toPixels(centerY, unit)}
                angle={angle}
                size={ARROW_BUTTON_SIZE}
                onClick={() => onNewWallClick('end', angle)}
              />
            );
          })}
        </>
      )}
    </Group>
  );
}

