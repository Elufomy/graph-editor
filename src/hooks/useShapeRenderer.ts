import { useCallback, RefObject } from 'react';
import { Point, Shape } from '../types/shared';

export const useShapeRenderer = (
  ctxRef: RefObject<CanvasRenderingContext2D | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>
) => {
  const drawBresenhamLine = useCallback((
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number,
    x1: number, y1: number,
    color: string, thickness: number
  ) => {
    let x = Math.round(x0), y = Math.round(y0);
    const xEnd = Math.round(x1), yEnd = Math.round(y1);
    let dx = Math.abs(xEnd - x), dy = Math.abs(yEnd - y);
    const sx = x < xEnd ? 1 : -1, sy = y < yEnd ? 1 : -1;
    let err = dx - dy;
    
    ctx.fillStyle = color;
    
    while (true) {
      ctx.beginPath();
      ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
      ctx.fill();
      if (x === xEnd && y === yEnd) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }, []);

  const drawWuLine = useCallback((
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number,
    x1: number, y1: number,
    color: string, thickness: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, []);

  const drawCircle = useCallback((
    ctx: CanvasRenderingContext2D,
    center: Point, radius: number,
    color: string, opacity: number,
    isFilled: boolean, thickness: number
  ) => {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    if (isFilled) {
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.globalAlpha = 1;
    ctx.stroke();
  }, []);

  const drawPolygon = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Point[], color: string,
    opacity: number, isFilled: boolean, thickness: number
  ) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    if (isFilled && points.length >= 3) {
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.globalAlpha = 1;
    ctx.stroke();
  }, []);

  const drawFreehand = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Point[], color: string,
    thickness: number, algorithm: 'bresenham' | 'wu'
  ) => {
    if (points.length < 2) return;
    for (let i = 0; i < points.length - 1; i++) {
      if (algorithm === 'bresenham') {
        drawBresenhamLine(ctx, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color, thickness);
      } else {
        drawWuLine(ctx, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color, thickness);
      }
    }
  }, [drawBresenhamLine, drawWuLine]);

  const drawAllShapes = useCallback((
    shapes: Shape[],
    selectedId: string | null,
    currentDrawing: Shape | null,
    tempPoints: Point[],
    lineAlgorithm: 'bresenham' | 'wu'
  ) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Рисуем все сохраненные фигуры
    for (const shape of shapes) {
      ctx.save();
      if (shape.type === 'circle' && shape.points.length >= 1) {
        const radius = shape.points.length >= 2
          ? Math.hypot(shape.points[1].x - shape.points[0].x, shape.points[1].y - shape.points[0].y)
          : 30;
        drawCircle(ctx, shape.points[0], radius, shape.color, shape.opacity, shape.isFilled, shape.thickness);
      } else if (shape.type === 'polygon' && shape.points.length >= 2) {
        drawPolygon(ctx, shape.points, shape.color, shape.opacity, shape.isFilled, shape.thickness);
      } else if (shape.type === 'line' && shape.points.length >= 2) {
        if (lineAlgorithm === 'bresenham') {
          drawBresenhamLine(ctx, shape.points[0].x, shape.points[0].y, shape.points[1].x, shape.points[1].y, shape.color, shape.thickness);
        } else {
          drawWuLine(ctx, shape.points[0].x, shape.points[0].y, shape.points[1].x, shape.points[1].y, shape.color, shape.thickness);
        }
      } else if (shape.type === 'freehand' && shape.points.length >= 2) {
        drawFreehand(ctx, shape.points, shape.color, shape.thickness, lineAlgorithm);
      } else if (shape.type === 'square' && shape.points.length >= 2) {
        const p1 = shape.points[0], p2 = shape.points[1];
        const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x), h = Math.abs(p2.y - p1.y);
        const rect = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
        drawPolygon(ctx, rect, shape.color, shape.opacity, shape.isFilled, shape.thickness);
      }
      ctx.restore();
    }

    // Рисуем текущую фигуру (предпросмотр)
    if (currentDrawing) {
      ctx.save();
      if (currentDrawing.type === 'circle' && currentDrawing.points.length >= 1) {
        const radius = currentDrawing.points.length >= 2
          ? Math.hypot(currentDrawing.points[1].x - currentDrawing.points[0].x, currentDrawing.points[1].y - currentDrawing.points[0].y)
          : 0;
        if (radius > 0) {
          drawCircle(ctx, currentDrawing.points[0], radius, currentDrawing.color, currentDrawing.opacity, currentDrawing.isFilled, currentDrawing.thickness);
        }
      } else if (currentDrawing.type === 'polygon' && currentDrawing.points.length >= 1 && tempPoints.length > 0) {
        drawPolygon(ctx, [...currentDrawing.points, ...tempPoints], currentDrawing.color, currentDrawing.opacity, currentDrawing.isFilled, currentDrawing.thickness);
      } else if (currentDrawing.type === 'line' && currentDrawing.points.length === 1 && tempPoints.length > 0) {
        if (lineAlgorithm === 'bresenham') {
          drawBresenhamLine(ctx, currentDrawing.points[0].x, currentDrawing.points[0].y, tempPoints[0].x, tempPoints[0].y, currentDrawing.color, currentDrawing.thickness);
        } else {
          drawWuLine(ctx, currentDrawing.points[0].x, currentDrawing.points[0].y, tempPoints[0].x, tempPoints[0].y, currentDrawing.color, currentDrawing.thickness);
        }
      } else if (currentDrawing.type === 'freehand' && currentDrawing.points.length >= 1 && tempPoints.length > 0) {
        drawFreehand(ctx, [...currentDrawing.points, ...tempPoints], currentDrawing.color, currentDrawing.thickness, lineAlgorithm);
      } else if (currentDrawing.type === 'square' && currentDrawing.points.length === 1 && tempPoints.length > 0) {
        const p1 = currentDrawing.points[0], p2 = tempPoints[0];
        const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x), h = Math.abs(p2.y - p1.y);
        const rect = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
        drawPolygon(ctx, rect, currentDrawing.color, currentDrawing.opacity, currentDrawing.isFilled, currentDrawing.thickness);
      }
      ctx.restore();
    }
  }, [canvasRef, ctxRef, drawCircle, drawPolygon, drawBresenhamLine, drawWuLine, drawFreehand]);

  return {
    drawBresenhamLine,
    drawWuLine,
    drawCircle,
    drawPolygon,
    drawFreehand,
    drawAllShapes
  };
};