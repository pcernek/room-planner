export type Unit = 'cm' | 'ft-in';

export interface IWall {
  id: string;
  length: number;
  angle: number;
  previousWallId: string | null;
  unit: Unit;
}

export interface INewWall {
  length: number;
  unit: Unit;
  angle: number;
  fromNode: {
    wallId: string;
    endpoint: 'start' | 'end';
  } | null;
}

export interface IDoor {
  id: string;
  wallId: string;
  offsetFromStart: number;
  width: number;
  unit: Unit;
}

export interface INewDoor {
  wallId: string;
  offsetFromStart: number;
  width: number;
  unit: Unit;
}

export interface IFurniture {
  id: string;
  name: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  rotation: number;
  unit: Unit;
}

export interface INewFurniture {
  name: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  rotation: number;
  unit: Unit;
}

export interface IRoom {
  name: string;
  unit: Unit;
  originWallId: string | null;
  walls: IWall[];
  doors: IDoor[];
  furniture: IFurniture[];
}

export interface IPoint {
  x: number;
  y: number;
}

export interface IWallGeometry {
  id: string;
  startPoint: IPoint;
  endPoint: IPoint;
  angle: number;
  lengthInCm: number;
}

export interface IViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

