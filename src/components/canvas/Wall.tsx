import { Line } from 'react-konva';
import Konva from 'konva';
import { IWallGeometry } from '../../types';

const PIXELS_PER_CM = 2;
const WALL_THICKNESS = 8;
const WALL_COLOR = '#333';
const HOVER_COLOR = '#FF6B6B';
const SELECTION_COLOR = '#FF6B6B';

interface IProps {
  geometry: IWallGeometry;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function Wall({ geometry, isSelected, isHovered, onSelect, onMouseEnter, onMouseLeave }: IProps) {
  return (
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
  );
}

