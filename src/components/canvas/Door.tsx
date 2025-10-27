import { Arc, Rect, Group } from 'react-konva';
import Konva from 'konva';
import { IDoor, IWallGeometry, Unit } from '../../types';
import { toPixels, pointToPixels, fromPixels } from '../../utils/canvas';
import { useHover } from '../../store/HoverContext';

const WALL_THICKNESS = 8;
const DOOR_COLOR = '#000000';
const DOOR_FILL = '#FFFFFF';
const ARC_COLOR = '#000000';
const SELECTION_COLOR = '#FF6B6B';

interface IProps {
  door: IDoor;
  wallGeometry: IWallGeometry;
  unit: Unit;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (newOffsetFromStart: number) => void;
}

export function Door({
  door,
  wallGeometry,
  unit,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
}: IProps) {
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

  const doorWidthPixels = toPixels(width, unit);
  const rectRotation = wallAngle * (180 / Math.PI);

  const handleMouseEnter = () => {
    setHover('door', door.id);
  };

  const handleMouseLeave = () => {
    clearHover();
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'grabbing';
    onDragStart();
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const scale = stage.scaleX();
    const stagePos = stage.position();

    const worldX = fromPixels((pointerPos.x - stagePos.x) / scale, unit);
    const worldY = fromPixels((pointerPos.y - stagePos.y) / scale, unit);

    const wallLengthSq = dx * dx + dy * dy;
    const projectionT =
      ((worldX - wallGeometry.startPoint.x) * dx + (worldY - wallGeometry.startPoint.y) * dy) /
      wallLengthSq;
    const clampedT = Math.max(0, Math.min(1, projectionT));

    const newOffsetFromStart = clampedT * wallLength;
    const clampedOffset = Math.max(0, Math.min(wallLength - width, newOffsetFromStart));

    const newT = clampedOffset / wallLength;
    const newDoorStart = {
      x: wallGeometry.startPoint.x + newT * dx,
      y: wallGeometry.startPoint.y + newT * dy,
    };
    const newDoorStartPixels = pointToPixels(newDoorStart, unit);

    e.target.position({
      x: newDoorStartPixels.x,
      y: newDoorStartPixels.y,
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'grab';

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const scale = stage.scaleX();
    const stagePos = stage.position();

    const worldX = fromPixels((pointerPos.x - stagePos.x) / scale, unit);
    const worldY = fromPixels((pointerPos.y - stagePos.y) / scale, unit);

    const wallLengthSq = dx * dx + dy * dy;
    const projectionT =
      ((worldX - wallGeometry.startPoint.x) * dx + (worldY - wallGeometry.startPoint.y) * dy) /
      wallLengthSq;
    const clampedT = Math.max(0, Math.min(1, projectionT));

    const newOffsetFromStart = clampedT * wallLength;
    const clampedOffset = Math.max(0, Math.min(wallLength - width, newOffsetFromStart));

    onDragEnd(clampedOffset);
  };

  return (
    <Group
      x={doorStartPixels.x}
      y={doorStartPixels.y}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      onTap={onSelect}
    >
      <Arc
        x={arcPosition.x - doorStartPixels.x}
        y={arcPosition.y - doorStartPixels.y}
        innerRadius={0}
        outerRadius={doorWidthPixels}
        angle={arcAngle}
        rotation={arcRotation}
        scaleX={scaleX}
        scaleY={scaleY}
        stroke={isSelected ? SELECTION_COLOR : ARC_COLOR}
        strokeWidth={2}
      />
      <Rect
        x={0}
        y={0}
        width={doorWidthPixels}
        height={WALL_THICKNESS}
        offsetY={WALL_THICKNESS / 2}
        rotation={rectRotation}
        fill={isSelected ? SELECTION_COLOR : DOOR_FILL}
        stroke={isSelected ? SELECTION_COLOR : DOOR_COLOR}
        strokeWidth={1}
      />
    </Group>
  );
}
