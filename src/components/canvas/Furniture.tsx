import { Rect, Text, Group } from 'react-konva';
import { IFurniture } from '../../types';
import { toCm } from '../../utils/units';

const PIXELS_PER_CM = 2;
const FURNITURE_COLOR = '#4A90E2';
const SELECTION_COLOR = '#FF6B6B';

interface IProps {
  furniture: IFurniture;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export function Furniture({ furniture, isSelected, onSelect, onDragEnd }: IProps) {
  const widthInCm = toCm(furniture.width, furniture.unit);
  const heightInCm = toCm(furniture.height, furniture.unit);

  return (
    <Group
      x={furniture.position.x * PIXELS_PER_CM}
      y={furniture.position.y * PIXELS_PER_CM}
      rotation={furniture.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        onDragEnd(node.x() / PIXELS_PER_CM, node.y() / PIXELS_PER_CM);
      }}
    >
      <Rect
        width={widthInCm * PIXELS_PER_CM}
        height={heightInCm * PIXELS_PER_CM}
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

