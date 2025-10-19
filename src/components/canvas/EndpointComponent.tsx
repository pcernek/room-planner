import { Circle } from 'react-konva';
import { IPoint } from '../../types';

const PIXELS_PER_CM = 2;
const ENDPOINT_RADIUS = 8;
const FREE_ENDPOINT_RADIUS = 12;
const SELECTION_COLOR = '#FF6B6B';

interface IProps {
  point: IPoint;
  isFree?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function EndpointComponent({
  point,
  isFree = false,
  isSelected = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: IProps) {
  if (isFree) {
    return (
      <Circle
        x={point.x * PIXELS_PER_CM}
        y={point.y * PIXELS_PER_CM}
        radius={FREE_ENDPOINT_RADIUS}
        fill={isSelected ? SELECTION_COLOR : '#fff'}
        stroke={isSelected ? SELECTION_COLOR : '#4A90E2'}
        strokeWidth={3}
        onClick={onClick}
        onTap={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  return (
    <Circle
      x={point.x * PIXELS_PER_CM}
      y={point.y * PIXELS_PER_CM}
      radius={ENDPOINT_RADIUS}
      fill={isHovered ? SELECTION_COLOR : '#666'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

