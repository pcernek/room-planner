import { Line, Arc } from 'react-konva';
import Konva from 'konva';
import { IDoor, IWallGeometry, Unit } from '../../types';
import { toPixels, pointToPixels } from '../../utils/canvas';

const WALL_THICKNESS = 8;
const DOOR_COLOR = '#8B4513';
const SELECTION_COLOR = '#FF6B6B';

interface IProps {
  door: IDoor;
  wallGeometry: IWallGeometry;
  unit: Unit;
  isSelected: boolean;
  onSelect: () => void;
}

export function Door({ door, wallGeometry, unit, isSelected, onSelect }: IProps) {
  const offset = door.offsetFromStart;
  const width = door.width;

  const dx = wallGeometry.endPoint.x - wallGeometry.startPoint.x;
  const dy = wallGeometry.endPoint.y - wallGeometry.startPoint.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);

  if (wallLength === 0) return null;

  const t = offset / wallLength;
  const doorStart = {
    x: wallGeometry.startPoint.x + t * dx,
    y: wallGeometry.startPoint.y + t * dy,
  };

  const t2 = (offset + width) / wallLength;
  const doorEnd = {
    x: wallGeometry.startPoint.x + t2 * dx,
    y: wallGeometry.startPoint.y + t2 * dy,
  };

  const doorStartPixels = pointToPixels(doorStart, unit);
  const doorEndPixels = pointToPixels(doorEnd, unit);

  const startAngle = Math.atan2(dy, dx);
  const endAngle = startAngle + Math.PI / 2;

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'pointer';
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'default';
  };

  return (
    <>
      <Line
        points={[
          doorStartPixels.x,
          doorStartPixels.y,
          doorEndPixels.x,
          doorEndPixels.y,
        ]}
        stroke={isSelected ? SELECTION_COLOR : DOOR_COLOR}
        strokeWidth={WALL_THICKNESS}
        lineCap="butt"
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <Arc
        x={doorEndPixels.x}
        y={doorEndPixels.y}
        innerRadius={0}
        outerRadius={toPixels(width, unit)}
        angle={(endAngle - startAngle) * (180 / Math.PI)}
        rotation={startAngle * (180 / Math.PI)}
        stroke={isSelected ? SELECTION_COLOR : '#DDD'}
        strokeWidth={1}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        onTap={onSelect}
      />
    </>
  );
}

