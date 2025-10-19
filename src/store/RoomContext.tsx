import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { IRoom, IWall, IDoor, IFurniture, Tool, IViewport } from '../types';

interface IRoomState {
  room: IRoom;
  selectedEntityId: string | null;
  selectedEntityType: 'wall' | 'door' | 'furniture' | null;
  activeTool: Tool;
  viewport: IViewport;
}

type RoomAction =
  | { type: 'SET_ROOM'; payload: IRoom }
  | { type: 'ADD_WALL'; payload: IWall }
  | { type: 'UPDATE_WALL'; payload: { id: string; updates: Partial<IWall> } }
  | { type: 'DELETE_WALL'; payload: string }
  | { type: 'ADD_DOOR'; payload: IDoor }
  | { type: 'UPDATE_DOOR'; payload: { id: string; updates: Partial<IDoor> } }
  | { type: 'DELETE_DOOR'; payload: string }
  | { type: 'ADD_FURNITURE'; payload: IFurniture }
  | { type: 'UPDATE_FURNITURE'; payload: { id: string; updates: Partial<IFurniture> } }
  | { type: 'DELETE_FURNITURE'; payload: string }
  | { type: 'SET_SELECTED_ENTITY'; payload: { id: string | null; entityType: 'wall' | 'door' | 'furniture' | null } }
  | { type: 'SET_ACTIVE_TOOL'; payload: Tool }
  | { type: 'SET_VIEWPORT'; payload: Partial<IViewport> };

const initialState: IRoomState = {
  room: {
    originWallId: null,
    walls: [],
    doors: [],
    furniture: [],
  },
  selectedEntityId: null,
  selectedEntityType: null,
  activeTool: 'select',
  viewport: {
    offsetX: 400,
    offsetY: 400,
    scale: 1,
  },
};

function roomReducer(state: IRoomState, action: RoomAction): IRoomState {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.payload };

    case 'ADD_WALL': {
      const newWalls = [...state.room.walls, action.payload];
      const newOriginWallId = state.room.originWallId || action.payload.id;
      return {
        ...state,
        room: { ...state.room, walls: newWalls, originWallId: newOriginWallId },
      };
    }

    case 'UPDATE_WALL': {
      const newWalls = state.room.walls.map(wall =>
        wall.id === action.payload.id ? { ...wall, ...action.payload.updates } : wall
      );
      return { ...state, room: { ...state.room, walls: newWalls } };
    }

    case 'DELETE_WALL': {
      const newWalls = state.room.walls.filter(wall => wall.id !== action.payload);
      const newOriginWallId = state.room.originWallId === action.payload ? null : state.room.originWallId;
      return {
        ...state,
        room: { ...state.room, walls: newWalls, originWallId: newOriginWallId },
      };
    }

    case 'ADD_DOOR': {
      const newDoors = [...state.room.doors, action.payload];
      return { ...state, room: { ...state.room, doors: newDoors } };
    }

    case 'UPDATE_DOOR': {
      const newDoors = state.room.doors.map(door =>
        door.id === action.payload.id ? { ...door, ...action.payload.updates } : door
      );
      return { ...state, room: { ...state.room, doors: newDoors } };
    }

    case 'DELETE_DOOR': {
      const newDoors = state.room.doors.filter(door => door.id !== action.payload);
      return { ...state, room: { ...state.room, doors: newDoors } };
    }

    case 'ADD_FURNITURE': {
      const newFurniture = [...state.room.furniture, action.payload];
      return { ...state, room: { ...state.room, furniture: newFurniture } };
    }

    case 'UPDATE_FURNITURE': {
      const newFurniture = state.room.furniture.map(furniture =>
        furniture.id === action.payload.id ? { ...furniture, ...action.payload.updates } : furniture
      );
      return { ...state, room: { ...state.room, furniture: newFurniture } };
    }

    case 'DELETE_FURNITURE': {
      const newFurniture = state.room.furniture.filter(furniture => furniture.id !== action.payload);
      return { ...state, room: { ...state.room, furniture: newFurniture } };
    }

    case 'SET_SELECTED_ENTITY':
      return {
        ...state,
        selectedEntityId: action.payload.id,
        selectedEntityType: action.payload.entityType,
      };

    case 'SET_ACTIVE_TOOL':
      return { ...state, activeTool: action.payload };

    case 'SET_VIEWPORT':
      return { ...state, viewport: { ...state.viewport, ...action.payload } };

    default:
      return state;
  }
}

interface IRoomContextValue {
  state: IRoomState;
  dispatch: React.Dispatch<RoomAction>;
}

const RoomContext = createContext<IRoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(roomReducer, initialState);

  return (
    <RoomContext.Provider value={{ state, dispatch }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
}

