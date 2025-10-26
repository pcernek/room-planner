import { Line, Group } from 'react-konva';
import Konva from 'konva';
import { IWallGeometry, Unit } from '../../types';
import { NewWallButton } from './NewWallButton';
import { toPixels, pointToPixels, fromPixels } from '../../utils/canvas';
import { useHover } from '../../store/HoverContext';

const WALL_THICKNESS_CM = 12;
const WALL_COLOR = '#5c5c5c';
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
  const { setHover, clearHover } = useHover();
  const isActive = isSelected || isHovered;
  const wallAngle = geometry.angle;
  const perpendicularAngle1 = wallAngle + 90;
  const perpendicularAngle2 = wallAngle - 90;

  const wallThickness = toPixels(WALL_THICKNESS_CM / 2, 'cm');
  const startPixels = pointToPixels(geometry.startPoint, unit);
  const endPixels = pointToPixels(geometry.endPoint, unit);

  const handleMouseEnter = () => {
    setHover('wall', geometry.id);
    onMouseEnter();
  };

  const handleMouseLeave = () => {
    clearHover();
    onMouseLeave();
  };

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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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

