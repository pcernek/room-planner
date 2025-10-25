import { Line, Arc } from 'react-konva';
import { IDoor, IWallGeometry, Unit } from '../../types';
import { toPixels, pointToPixels } from '../../utils/canvas';
import { useHover } from '../../store/HoverContext';

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
  const { setHover, clearHover } = useHover();
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

  const wallAngle = Math.atan2(dy, dx);
  const arcRotation = wallAngle * (180 / Math.PI);
  const arcAngle = 90;

  const scaleX = door.swapHinge ? -1 : 1;
  const scaleY = door.reverseSwing ? -1 : 1;

  const arcPosition = door.swapHinge ? doorEndPixels : doorStartPixels;

  const handleMouseEnter = () => {
    setHover('door', door.id);
  };

  const handleMouseLeave = () => {
    clearHover();
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
        x={arcPosition.x}
        y={arcPosition.y}
        innerRadius={0}
        outerRadius={toPixels(width, unit)}
        angle={arcAngle}
        rotation={arcRotation}
        scaleX={scaleX}
        scaleY={scaleY}
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

