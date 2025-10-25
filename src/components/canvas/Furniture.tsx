import { Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { IFurniture, Unit } from '../../types';
import { toPixels, pointToPixels, fromPixels } from '../../utils/canvas';

const FURNITURE_COLOR = '#4A90E2';
const SELECTION_COLOR = '#FF6B6B';

const TEXT_PADDING_PX = 8;

interface IProps {
  furniture: IFurniture;
  unit: Unit;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function Furniture({ furniture, unit, isSelected, onSelect, onDragStart, onDragEnd }: IProps) {
  const width = furniture.width;
  const height = furniture.height;
  const positionPixels = pointToPixels(furniture.position, unit);

  // Calculate bounding box for rotated rectangle
  const rotationRad = (furniture.rotation * Math.PI) / 180;
  const widthPixels = toPixels(width, unit);
  const heightPixels = toPixels(height, unit);
  const boundingWidth = Math.abs(widthPixels * Math.cos(rotationRad)) + Math.abs(heightPixels * Math.sin(rotationRad));

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = isSelected ? 'grab' : 'pointer';
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'move';
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'grabbing';
    onDragStart();
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'grab';
    onDragEnd(fromPixels(node.x(), unit), fromPixels(node.y(), unit));
  };

  return (
    <Group
      x={positionPixels.x}
      y={positionPixels.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <Group
        rotation={furniture.rotation}
        offsetX={toPixels(width, unit) / 2}
        offsetY={toPixels(height, unit) / 2}
      >
        <Rect
          width={toPixels(width, unit)}
          height={toPixels(height, unit)}
          fill={FURNITURE_COLOR}
          stroke={isSelected ? SELECTION_COLOR : "#FFF"}
          strokeWidth={1}
        // dash={isSelected ? [10, 5] : undefined}
        />
      </Group>
      <Text
        text={furniture.name}
        fontSize={12}
        fill="#FFF"
        x={-boundingWidth / 2 + TEXT_PADDING_PX}
        y={-6}
        width={boundingWidth - 16}
        align="center"
        listening={false}
      />
    </Group>
  );
}

