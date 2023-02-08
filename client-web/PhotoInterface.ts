import { vec3 } from 'gl-matrix';

export interface PhotoInterface {
  id: number;

  caption: string;

  location: [number, number];

  offset: vec3;

  xRotation: number;

  yRotation: number;

  zRotation: number;

  translation: vec3;

  onChange: (() => void) | null;

  setOffset(x: number | null, y: number | null, z: number | null): void;

  setTranslation(x: number | null, y: number | null, z: number | null): void;

  setRotation(x: number | null, y: number | null, z: number | null): void;

  save(): void;
}
