export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  name: string;
  type: 'circle' | 'square' | 'polygon' | 'line' | 'freehand';
  points: Point[];
  color: string;
  opacity: number;
  thickness: number;
  isFilled: boolean;
}

export type ToolType = 'select' | 'circle' | 'square' | 'polygon' | 'line' | 'freehand';

export const getNextName = (shapes: Shape[], type: string): string => {
  const count = shapes.filter(s => s.type === type).length;
  const names: Record<string, string> = {
    circle: 'Круг',
    square: 'Квадрат',
    polygon: 'Многоугольник',
    line: 'Линия',
    freehand: 'Рисунок'
  };
  return `${names[type]} ${count + 1}`;
};

export const getBounds = (points: Point[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
};

export const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};