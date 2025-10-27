import { Line, Group } from 'react-konva';
import Konva from 'konva';
import { IWallGeometry, Unit } from '../../types';
import { EndpointExtensionButton } from './EndpointExtensionButton';
import { toPixels, pointToPixels } from '../../utils/canvas';
import { useHover } from '../../store/HoverContext';

const WALL_THICKNESS_CM = 12;
const WALL_COLOR = '#5c5c5c';
const HOVER_COLOR = '#FF6B6B';
const SELECTION_COLOR = '#FF6B6B';

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
  onNewWallClick: (endpoint: 'start' | 'end') => void;
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
  onNewWallClick,
}: IProps) {
  const { setHover, clearHover } = useHover();
  const isActive = isSelected || isHovered;

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
        points={[startPixels.x, startPixels.y, endPixels.x, endPixels.y]}
        stroke={isSelected ? SELECTION_COLOR : isHovered ? HOVER_COLOR : WALL_COLOR}
        strokeWidth={wallThickness}
        lineCap="round"
        lineJoin="round"
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {hasStartFree && (
        <EndpointExtensionButton
          x={geometry.startPoint.x}
          y={geometry.startPoint.y}
          unit={unit}
          isVisible={isActive}
          onClick={() => onNewWallClick('start')}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {hasEndFree && (
        <EndpointExtensionButton
          x={geometry.endPoint.x}
          y={geometry.endPoint.y}
          unit={unit}
          isVisible={isActive}
          onClick={() => onNewWallClick('end')}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </Group>
  );
}
