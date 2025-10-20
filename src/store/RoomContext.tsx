import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { IRoom, IWall, IDoor, IFurniture, INewWall, INewDoor, INewFurniture, Tool } from '../types';
import { addAngles } from '../utils/geometry';
import { newEntityId } from '../utils/id';

interface IRoomState {
  room: IRoom;
  selectedEntityId: string | null;
  selectedEntityType: 'wall' | 'door' | 'furniture' | null;
  activeTool: Tool;
}

type RoomAction =
  | { type: 'SET_ROOM'; payload: IRoom }
  | { type: 'ADD_WALL'; payload: INewWall }
  | { type: 'UPDATE_WALL'; payload: { id: string; updates: Partial<IWall> } }
  | { type: 'DELETE_WALL'; payload: string }
  | { type: 'ADD_DOOR'; payload: INewDoor }
  | { type: 'UPDATE_DOOR'; payload: { id: string; updates: Partial<IDoor> } }
  | { type: 'DELETE_DOOR'; payload: string }
  | { type: 'ADD_FURNITURE'; payload: INewFurniture }
  | { type: 'UPDATE_FURNITURE'; payload: { id: string; updates: Partial<IFurniture> } }
  | { type: 'DELETE_FURNITURE'; payload: string }
  | { type: 'SET_SELECTED_ENTITY'; payload: { id: string | null; entityType: 'wall' | 'door' | 'furniture' | null } }
  | { type: 'SET_ACTIVE_TOOL'; payload: Tool };

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
};

function roomReducer(state: IRoomState, action: RoomAction): IRoomState {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.payload };

    case 'ADD_WALL': {
      const { fromNode, ...wallData } = action.payload;
      const newWallId = newEntityId();

      let newWall: IWall;
      let updatedWalls = [...state.room.walls];
      let newOriginWallId = state.room.originWallId;

      if (!fromNode) {
        newWall = {
          id: newWallId,
          previousWallId: null,
          ...wallData,
        };
        updatedWalls.push(newWall);
        newOriginWallId = newOriginWallId || newWallId;
      } else if (fromNode.endpoint === 'start') {
        newWall = {
          id: newWallId,
          previousWallId: null,
          ...wallData,
          angle: addAngles(wallData.angle, 180),
        };
        updatedWalls = state.room.walls.map(wall =>
          wall.id === fromNode.wallId
            ? { ...wall, previousWallId: newWallId }
            : wall
        );
        updatedWalls.unshift(newWall);
      } else {
        newWall = {
          id: newWallId,
          previousWallId: fromNode.wallId,
          ...wallData,
        };
        updatedWalls.push(newWall);
      }

      return {
        ...state,
        room: { ...state.room, walls: updatedWalls, originWallId: newOriginWallId },
        selectedEntityId: newWallId,
        selectedEntityType: 'wall',
      };
    }

    case 'UPDATE_WALL': {
      const newWalls = state.room.walls.map(wall =>
        wall.id === action.payload.id ? { ...wall, ...action.payload.updates } : wall
      );
      return { ...state, room: { ...state.room, walls: newWalls } };
    }

    case 'DELETE_WALL': {
      const firstWallId = state.room.walls[0]?.id;
      const lastWallId = state.room.walls[state.room.walls.length - 1]?.id;

      if (action.payload !== firstWallId && action.payload !== lastWallId) {
        return state;
      }

      const newWalls = state.room.walls.filter(wall => wall.id !== action.payload);

      let newOriginWallId = state.room.originWallId === action.payload ? null : state.room.originWallId;
      let newFirstWallId: string | null = null;

      if (newWalls.length > 0) {
        newFirstWallId = newWalls.find(wall => !wall.previousWallId)?.id || null;

        if (newOriginWallId && !newWalls.find(wall => wall.id === newOriginWallId)) {
          newOriginWallId = newFirstWallId;
        }
      }

      return {
        ...state,
        room: { ...state.room, walls: newWalls, originWallId: newOriginWallId },
      };
    }

    case 'ADD_DOOR': {
      const newDoor: IDoor = {
        id: newEntityId(),
        ...action.payload,
      };
      const newDoors = [...state.room.doors, newDoor];
      return {
        ...state,
        room: { ...state.room, doors: newDoors },
        selectedEntityId: newDoor.id,
        selectedEntityType: 'door',
      };
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
      const newFurnitureItem: IFurniture = {
        id: newEntityId(),
        ...action.payload,
      };
      const newFurniture = [...state.room.furniture, newFurnitureItem];
      return {
        ...state,
        room: { ...state.room, furniture: newFurniture },
        selectedEntityId: newFurnitureItem.id,
        selectedEntityType: 'furniture',
      };
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

