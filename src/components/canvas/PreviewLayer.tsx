import { Fragment } from 'react';
import { Circle, Rect } from 'react-konva';
import { IPoint, Unit } from '../../types';
import { toPixels } from '../../utils/canvas';

interface IPreviewLayerProps {
  furnitureStart: IPoint | null;
  previewRect: { x: number; y: number; width: number; height: number } | null;
  unit: Unit;
}

export function PreviewLayer({ furnitureStart, previewRect, unit }: IPreviewLayerProps) {
  return (
    <Fragment>
      {furnitureStart && (
        <Circle
          x={toPixels(furnitureStart.x, unit)}
          y={toPixels(furnitureStart.y, unit)}
          radius={8}
          stroke="#4A90E2"
          strokeWidth={2}
          listening={false}
        />
      )}

      {previewRect && (
        <Rect
          x={toPixels(previewRect.x, unit)}
          y={toPixels(previewRect.y, unit)}
          width={toPixels(previewRect.width, unit)}
          height={toPixels(previewRect.height, unit)}
          stroke="#4A90E2"
          strokeWidth={2}
          dash={[5, 5]}
          fill="rgba(74, 144, 226, 0.1)"
          listening={false}
        />
      )}
    </Fragment>
  );
}
