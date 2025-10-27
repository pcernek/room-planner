import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import {
  IRoom,
  IWall,
  IDoor,
  IFurniture,
  INewWall,
  INewDoor,
  INewFurniture,
  Unit,
  IWallSequence,
  IPoint,
} from '../types';
import { newEntityId } from '../utils/id';

const LOCAL_STORAGE_KEY = 'room-planner-state';

function loadRoomFromStorage(): IRoom | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.name && parsed.unit) {
        if (Array.isArray(parsed.doors)) {
          parsed.doors = parsed.doors.map((door: IDoor) => ({
            ...door,
            swapHinge: door.swapHinge ?? false,
            reverseSwing: door.reverseSwing ?? false,
          }));
        }

        if (Array.isArray(parsed.walls)) {
          let currentPoint = { x: 0, y: 0 };
          const walls: IWall[] = parsed.walls.map(
            (wall: IWall & { startPoint?: { x: number; y: number } }, index: number) => {
              if (wall.startPoint) {
                currentPoint = wall.startPoint;
              }
              const angleRad = (wall.angle * Math.PI) / 180;
              const nextPoint = {
                x: currentPoint.x + wall.length * Math.cos(angleRad),
                y: currentPoint.y + wall.length * Math.sin(angleRad),
              };
              currentPoint = nextPoint;

              return {
                id: wall.id,
                previousWallId: index === 0 ? null : parsed.walls[index - 1].id,
                length: wall.length,
                angle: wall.angle,
                unit: wall.unit,
              };
            }
          );

          const sequence: IWallSequence = {
            id: newEntityId(),
            position: parsed.walls[0]?.startPoint || { x: 0, y: 0 },
            walls,
          };

          parsed.wallSequences = [sequence];
          delete parsed.walls;
          delete parsed.originWallId;
        }

        if (!parsed.wallSequences) {
          parsed.wallSequences = [];
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
  selectedEntityType: 'wall' | 'door' | 'furniture' | 'wallSequence' | null;
}

type RoomAction =
  | { type: 'SET_ROOM'; payload: IRoom }
  | { type: 'INITIALIZE_ROOM'; payload: { name: string; unit: Unit } }
  | { type: 'ADD_WALL'; payload: INewWall | { wall: INewWall; startPoint: IPoint } }
  | { type: 'UPDATE_WALL'; payload: { id: string; updates: Partial<IWall> } }
  | { type: 'DELETE_WALL'; payload: string }
  | { type: 'ADD_DOOR'; payload: INewDoor }
  | { type: 'UPDATE_DOOR'; payload: { id: string; updates: Partial<IDoor> } }
  | { type: 'DELETE_DOOR'; payload: string }
  | { type: 'ADD_FURNITURE'; payload: INewFurniture }
  | { type: 'UPDATE_FURNITURE'; payload: { id: string; updates: Partial<IFurniture> } }
  | { type: 'DELETE_FURNITURE'; payload: string }
  | { type: 'UPDATE_WALL_SEQUENCE_POSITION'; payload: { id: string; position: IPoint } }
  | {
      type: 'SET_SELECTED_ENTITY';
      payload: {
        id: string | null;
        entityType: 'wall' | 'door' | 'furniture' | 'wallSequence' | null;
      };
    }
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
          wallSequences: [],
          doors: [],
          furniture: [],
        },
      };

    case 'ADD_WALL': {
      if (!state.room) return state;

      let wallData: INewWall;
      let startPoint: IPoint | undefined;

      if ('wall' in action.payload) {
        wallData = action.payload.wall;
        startPoint = action.payload.startPoint;
      } else {
        wallData = action.payload;
      }

      const { fromNode, ...wallProps } = wallData;
      const newWallId = newEntityId();

      if (!fromNode) {
        const newWall: IWall = {
          id: newWallId,
          previousWallId: null,
          ...wallProps,
        };

        const newSequence: IWallSequence = {
          id: newEntityId(),
          position: startPoint || { x: 0, y: 0 },
          walls: [newWall],
        };

        return {
          ...state,
          room: { ...state.room, wallSequences: [...state.room.wallSequences, newSequence] },
          selectedEntityId: newWallId,
          selectedEntityType: 'wall',
        };
      } else {
        let targetSequence: IWallSequence | null = null;
        let targetWall: IWall | null = null;

        for (const sequence of state.room.wallSequences) {
          const wall = sequence.walls.find((w) => w.id === fromNode.wallId);
          if (wall) {
            targetSequence = sequence;
            targetWall = wall;
            break;
          }
        }

        if (!targetSequence || !targetWall) return state;

        const newWall: IWall = {
          id: newWallId,
          previousWallId: null,
          ...wallProps,
        };

        let updatedSequence: IWallSequence;

        if (fromNode.endpoint === 'end') {
          newWall.previousWallId = fromNode.wallId;
          const wallIndex = targetSequence.walls.findIndex((w) => w.id === fromNode.wallId);
          const newWalls = [
            ...targetSequence.walls.slice(0, wallIndex + 1),
            newWall,
            ...targetSequence.walls.slice(wallIndex + 1),
          ];

          const wallsToUpdate = newWalls.slice(wallIndex + 2);
          wallsToUpdate.forEach((wall) => {
            const prevIndex = newWalls.indexOf(wall) - 1;
            if (prevIndex >= 0) {
              wall.previousWallId = newWalls[prevIndex].id;
            }
          });

          updatedSequence = {
            ...targetSequence,
            walls: newWalls,
          };
        } else {
          const firstWall = targetSequence.walls[0];
          firstWall.previousWallId = newWallId;

          const reversedAngle = (newWall.angle + 180) % 360;
          newWall.angle = reversedAngle;

          const angleRad = (reversedAngle * Math.PI) / 180;
          const newPosition = {
            x: targetSequence.position.x - newWall.length * Math.cos(angleRad),
            y: targetSequence.position.y - newWall.length * Math.sin(angleRad),
          };

          updatedSequence = {
            ...targetSequence,
            position: newPosition,
            walls: [newWall, ...targetSequence.walls],
          };
        }

        const updatedSequences = state.room.wallSequences.map((seq) =>
          seq.id === targetSequence.id ? updatedSequence : seq
        );

        return {
          ...state,
          room: { ...state.room, wallSequences: updatedSequences },
          selectedEntityId: newWallId,
          selectedEntityType: 'wall',
        };
      }
    }

    case 'UPDATE_WALL': {
      if (!state.room) return state;

      const updatedSequences = state.room.wallSequences.map((sequence) => ({
        ...sequence,
        walls: sequence.walls.map((wall) =>
          wall.id === action.payload.id ? { ...wall, ...action.payload.updates } : wall
        ),
      }));

      return { ...state, room: { ...state.room, wallSequences: updatedSequences } };
    }

    case 'DELETE_WALL': {
      if (!state.room) return state;

      const updatedSequences: IWallSequence[] = [];
      let deletedFromSequenceId: string | null = null;

      for (const sequence of state.room.wallSequences) {
        const wallIndex = sequence.walls.findIndex((w) => w.id === action.payload);

        if (wallIndex === -1) {
          updatedSequences.push(sequence);
          continue;
        }

        deletedFromSequenceId = sequence.id;

        if (sequence.walls.length === 1) {
          continue;
        }

        if (wallIndex === 0) {
          const remainingWalls = sequence.walls.slice(1);
          const newFirstWall = remainingWalls[0];
          newFirstWall.previousWallId = null;

          const angleRad = (sequence.walls[0].angle * Math.PI) / 180;
          const newPosition = {
            x: sequence.position.x + sequence.walls[0].length * Math.cos(angleRad),
            y: sequence.position.y + sequence.walls[0].length * Math.sin(angleRad),
          };

          updatedSequences.push({
            ...sequence,
            position: newPosition,
            walls: remainingWalls,
          });
        } else if (wallIndex === sequence.walls.length - 1) {
          const remainingWalls = sequence.walls.slice(0, wallIndex);
          updatedSequences.push({
            ...sequence,
            walls: remainingWalls,
          });
        } else {
          const firstSequenceWalls = sequence.walls.slice(0, wallIndex);
          const secondSequenceWalls = sequence.walls.slice(wallIndex + 1);

          secondSequenceWalls[0].previousWallId = null;

          let currentPoint = sequence.position;
          for (let i = 0; i <= wallIndex; i++) {
            const wall = sequence.walls[i];
            const angleRad = (wall.angle * Math.PI) / 180;
            currentPoint = {
              x: currentPoint.x + wall.length * Math.cos(angleRad),
              y: currentPoint.y + wall.length * Math.sin(angleRad),
            };
          }

          updatedSequences.push({
            ...sequence,
            walls: firstSequenceWalls,
          });

          updatedSequences.push({
            id: newEntityId(),
            position: currentPoint,
            walls: secondSequenceWalls,
          });
        }
      }

      const newDoors = state.room.doors.filter((door) => door.wallId !== action.payload);

      const shouldClearSelection =
        state.selectedEntityType === 'wallSequence' &&
        state.selectedEntityId === deletedFromSequenceId;

      return {
        ...state,
        room: { ...state.room, wallSequences: updatedSequences, doors: newDoors },
        selectedEntityId: shouldClearSelection ? null : state.selectedEntityId,
        selectedEntityType: shouldClearSelection ? null : state.selectedEntityType,
      };
    }

    case 'ADD_DOOR': {
      if (!state.room) return state;
      const newDoor: IDoor = {
        id: newEntityId(),
        ...action.payload,
        swapHinge: false,
        reverseSwing: false,
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
      const newDoors = state.room.doors.map((door) =>
        door.id === action.payload.id ? { ...door, ...action.payload.updates } : door
      );
      return { ...state, room: { ...state.room, doors: newDoors } };
    }

    case 'DELETE_DOOR': {
      if (!state.room) return state;
      const newDoors = state.room.doors.filter((door) => door.id !== action.payload);
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
      const newFurniture = state.room.furniture.map((furniture) =>
        furniture.id === action.payload.id ? { ...furniture, ...action.payload.updates } : furniture
      );
      return { ...state, room: { ...state.room, furniture: newFurniture } };
    }

    case 'DELETE_FURNITURE': {
      if (!state.room) return state;
      const newFurniture = state.room.furniture.filter(
        (furniture) => furniture.id !== action.payload
      );
      return { ...state, room: { ...state.room, furniture: newFurniture } };
    }

    case 'UPDATE_WALL_SEQUENCE_POSITION': {
      if (!state.room) return state;
      const updatedSequences = state.room.wallSequences.map((sequence) =>
        sequence.id === action.payload.id
          ? { ...sequence, position: action.payload.position }
          : sequence
      );
      return { ...state, room: { ...state.room, wallSequences: updatedSequences } };
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

  return <RoomContext.Provider value={{ state, dispatch }}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
}
