import { Mat3 } from '../lib/math/mat3';

export type ShapeType = 'square' | 'circle';

export interface Shape {
  id: string;
  type: ShapeType;
  matrix: Mat3;
  width: number;
  height: number;
  color: string;
}

export interface Point2D {
  x: number;
  y: number;
}