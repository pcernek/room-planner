import { Fragment } from 'react';
import { Line, Circle } from 'react-konva';
import { IPoint, Unit } from '../../types';
import { toPixels } from '../../utils/canvas';

interface IWallPreviewLayerProps {
  wallStart: IPoint | null;
  wallPreview: IPoint | null;
  unit: Unit;
}

export function WallPreviewLayer({ wallStart, wallPreview, unit }: IWallPreviewLayerProps) {
  return (
    <Fragment>
      {wallStart && wallPreview && (
        <>
          <Line
            points={[
              toPixels(wallStart.x, unit),
              toPixels(wallStart.y, unit),
              toPixels(wallPreview.x, unit),
              toPixels(wallPreview.y, unit),
            ]}
            stroke="#4A90E2"
            strokeWidth={2}
            dash={[10, 5]}
            listening={false}
          />
          <Circle
            x={toPixels(wallPreview.x, unit)}
            y={toPixels(wallPreview.y, unit)}
            radius={8}
            stroke="#4A90E2"
            strokeWidth={2}
            fill="#FFFFFF"
            listening={false}
          />
        </>
      )}
      {wallStart && (
        <Circle
          x={toPixels(wallStart.x, unit)}
          y={toPixels(wallStart.y, unit)}
          radius={8}
          stroke="#4A90E2"
          strokeWidth={2}
          fill="#FFFFFF"
          listening={false}
        />
      )}
    </Fragment>
  );
}
