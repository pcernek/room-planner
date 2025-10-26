import { Circle } from 'react-konva';
import Konva from 'konva';
import { IPoint, Unit } from '../../types';
import { pointToPixels } from '../../utils/canvas';
import { useHover } from '../../store/HoverContext';

const ENDPOINT_RADIUS = 8;
const FREE_ENDPOINT_RADIUS = 12;

interface IProps {
  point: IPoint;
  unit: Unit;
  isFree?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onSelect?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export function Endpoint({
  point,
  unit,
  isFree = false,
  onMouseEnter,
  onMouseLeave,
  onSelect,
}: IProps) {
  const { setHover, clearHover } = useHover();
  const pixelPoint = pointToPixels(point, unit);

  const handleMouseEnter = () => {
    setHover('endpoint', `${point.x},${point.y}`);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    clearHover();
    onMouseLeave?.();
  };

  if (isFree) {
    return (
      <Circle
        x={pixelPoint.x}
        y={pixelPoint.y}
        radius={FREE_ENDPOINT_RADIUS}
        fill="#fff"
        stroke="#4A90E2"
        strokeWidth={3}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        onTap={onSelect}
      />
    );
  }

  return (
    <Circle
      x={pixelPoint.x}
      y={pixelPoint.y}
      radius={ENDPOINT_RADIUS}
      fill="#666"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      onTap={onSelect}
    />
  );
}
