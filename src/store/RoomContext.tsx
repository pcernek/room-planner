import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { IRoom, IWall, IDoor, IFurniture, INewWall, INewDoor, INewFurniture, Unit } from '../types';
import { addAngles } from '../utils/geometry';
import { newEntityId } from '../utils/id';

const LOCAL_STORAGE_KEY = 'room-planner-state';

function loadRoomFromStorage(): IRoom | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.walls) && parsed.name && parsed.unit) {
        if (Array.isArray(parsed.doors)) {
          parsed.doors = parsed.doors.map((door: IDoor) => ({
            ...door,
            swapHinge: door.swapHinge ?? false,
            reverseSwing: door.reverseSwing ?? false,
          }));
        }
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load room from localStorage:', error);
  }

  return null;
}

interface IRoomState {
  room: IRoom | null;
  selectedEntityId: string | null;
  selectedEntityType: 'wall' | 'door' | 'furniture' | null;
}

type RoomAction =
  | { type: 'SET_ROOM'; payload: IRoom }
  | { type: 'INITIALIZE_ROOM'; payload: { name: string; unit: Unit } }
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
  | { type: 'CLEAR_ROOM' };

const initialState: IRoomState = {
  room: loadRoomFromStorage(),
  selectedEntityId: null,
  selectedEntityType: null,
};

function roomReducer(state: IRoomState, action: RoomAction): IRoomState {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.payload };

    case 'INITIALIZE_ROOM':
      return {
        ...state,
        room: {
          name: action.payload.name,
          unit: action.payload.unit,
          originWallId: null,
          walls: [],
          doors: [],
          furniture: [],
        },
      };

    case 'ADD_WALL': {
      if (!state.room) return state;

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
      if (!state.room) return state;
      const newWalls = state.room.walls.map(wall =>
        wall.id === action.payload.id ? { ...wall, ...action.payload.updates } : wall
      );
      return { ...state, room: { ...state.room, walls: newWalls } };
    }

    case 'DELETE_WALL': {
      if (!state.room) return state;
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
      if (!state.room) return state;
      const newDoor: IDoor = {
        id: newEntityId(),
        ...action.payload,
        swapHinge: action.payload.swapHinge ?? false,
        reverseSwing: action.payload.reverseSwing ?? false,
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
      if (!state.room) return state;
      const newDoors = state.room.doors.map(door =>
        door.id === action.payload.id ? { ...door, ...action.payload.updates } : door
      );
      return { ...state, room: { ...state.room, doors: newDoors } };
    }

    case 'DELETE_DOOR': {
      if (!state.room) return state;
      const newDoors = state.room.doors.filter(door => door.id !== action.payload);
      return { ...state, room: { ...state.room, doors: newDoors } };
    }

    case 'ADD_FURNITURE': {
      if (!state.room) return state;
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
      if (!state.room) return state;
      const newFurniture = state.room.furniture.map(furniture =>
        furniture.id === action.payload.id ? { ...furniture, ...action.payload.updates } : furniture
      );
      return { ...state, room: { ...state.room, furniture: newFurniture } };
    }

    case 'DELETE_FURNITURE': {
      if (!state.room) return state;
      const newFurniture = state.room.furniture.filter(furniture => furniture.id !== action.payload);
      return { ...state, room: { ...state.room, furniture: newFurniture } };
    }

    case 'SET_SELECTED_ENTITY':
      return {
        ...state,
        selectedEntityId: action.payload.id,
        selectedEntityType: action.payload.entityType,
      };

    case 'CLEAR_ROOM':
      return {
        ...state,
        room: null,
        selectedEntityId: null,
        selectedEntityType: null,
      };

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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.room));
    } catch (error) {
      console.error('Failed to save room to localStorage:', error);
    }
  }, [state.room]);

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

