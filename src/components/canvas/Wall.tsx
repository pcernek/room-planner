import { Line, Group } from 'react-konva';
import Konva from 'konva';
import { IWallGeometry } from '../../types';
import { Endpoint } from './Endpoint';
import { NewWallButton } from './NewWallButton';

const PIXELS_PER_CM = 2;
const WALL_THICKNESS = 8;
const WALL_COLOR = '#333';
const HOVER_COLOR = '#FF6B6B';
const SELECTION_COLOR = '#FF6B6B';
const ARROW_BUTTON_SIZE = 40;
const ARROW_BUTTON_DISTANCE = 50;

interface IProps {
  geometry: IWallGeometry;
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

  return (
    <Group>
      <Line
        points={[
          geometry.startPoint.x * PIXELS_PER_CM,
          geometry.startPoint.y * PIXELS_PER_CM,
          geometry.endPoint.x * PIXELS_PER_CM,
          geometry.endPoint.y * PIXELS_PER_CM,
        ]}
        stroke={isSelected ? SELECTION_COLOR : isHovered ? HOVER_COLOR : WALL_COLOR}
        strokeWidth={WALL_THICKNESS}
        lineCap="round"
        lineJoin="round"
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />

      <Endpoint point={geometry.startPoint} isFree={isActive && hasStartFree} />
      <Endpoint point={geometry.endPoint} isFree={isActive && hasEndFree} />

      {isActive && hasStartFree && (
        <>
          {[perpendicularAngle1, perpendicularAngle2].map((angle) => {
            const angleRad = (angle * Math.PI) / 180;
            const centerX = geometry.startPoint.x + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.cos(angleRad);
            const centerY = geometry.startPoint.y + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.sin(angleRad);

            return (
              <NewWallButton
                key={`start-${angle}`}
                x={centerX * PIXELS_PER_CM}
                y={centerY * PIXELS_PER_CM}
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
            const centerX = geometry.endPoint.x + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.cos(angleRad);
            const centerY = geometry.endPoint.y + (ARROW_BUTTON_DISTANCE / PIXELS_PER_CM) * Math.sin(angleRad);

            return (
              <NewWallButton
                key={`end-${angle}`}
                x={centerX * PIXELS_PER_CM}
                y={centerY * PIXELS_PER_CM}
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

