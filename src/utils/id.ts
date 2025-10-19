import { nanoid } from 'nanoid';

export function newEntityId(): string {
  return nanoid(8);
}

