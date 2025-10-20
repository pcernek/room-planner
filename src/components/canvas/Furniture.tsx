import { Rect, Text, Group } from 'react-konva';
import { IFurniture, Unit } from '../../types';
import { toPixels, pointToPixels, fromPixels } from '../../utils/canvas';

const FURNITURE_COLOR = '#4A90E2';
const SELECTION_COLOR = '#FF6B6B';

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

  return (
    <Group
      x={positionPixels.x}
      y={positionPixels.y}
      rotation={furniture.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={(e) => {
        e.cancelBubble = true;
        onDragStart();
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        const node = e.target;
        onDragEnd(fromPixels(node.x(), unit), fromPixels(node.y(), unit));
      }}
    >
      <Rect
        width={toPixels(width, unit)}
        height={toPixels(height, unit)}
        fill={isSelected ? SELECTION_COLOR : FURNITURE_COLOR}
        stroke="#FFF"
        strokeWidth={2}
      />
      <Text
        text={furniture.name}
        x={5}
        y={5}
        fontSize={12}
        fill="#FFF"
      />
    </Group>
  );
}

