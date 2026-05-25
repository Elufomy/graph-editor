import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RasterRenderer, RGBA, hexToRGBA } from '../lib/raster/RasterRenderer';

interface Shape {
  id: string;
  type: 'circle' | 'square' | 'line';
  points: { x: number; y: number }[];
  color: RGBA;
  width: number;
  isFilled: boolean;
}

interface CanvasSceneProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (id: string, newShape: Shape) => void;
}

const CanvasScene: React.FC<CanvasSceneProps> = ({ 
  shapes, 
  selectedShapeId, 
  onSelectShape,
  onUpdateShape 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragShapeId, setDragShapeId] = useState<string | null>(null);
  const [dragShapeStart, setDragShapeStart] = useState<Shape | null>(null);

  // Функция отрисовки всех фигур через растеризатор
  const drawAllShapes = useCallback(() => {
    if (!rendererRef.current) return;
    
    const r = rendererRef.current;
    r.beginFrame(true);
    
    for (const shape of shapes) {
      if (shape.type === 'circle' && shape.points.length >= 2) {
        const center = shape.points[0];
        const radius = Math.sqrt(
          Math.pow(shape.points[1].x - center.x, 2) + 
          Math.pow(shape.points[1].y - center.y, 2)
        );
        if (shape.isFilled) {
          r.fillCircle(center.x, center.y, radius, shape.color);
        }
        r.strokePolygon([{ x: center.x, y: center.y }], shape.color, shape.width);
      }
      else if (shape.type === 'square' && shape.points.length >= 2) {
        const p1 = shape.points[0];
        const p2 = shape.points[1];
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        
        const rect = [
          { x, y },
          { x: x + w, y },
          { x: x + w, y: y + h },
          { x, y: y + h }
        ];
        
        if (shape.isFilled) {
          r.fillPolygon(rect, shape.color);
        }
        r.strokePolygon(rect, shape.color, shape.width);
      }
      else if (shape.type === 'line' && shape.points.length >= 2) {
        r.strokeLine(
          shape.points[0].x, shape.points[0].y,
          shape.points[1].x, shape.points[1].y,
          shape.color, shape.width
        );
      }
    }
    
    r.commit();
  }, [shapes]);

  // Инициализация растеризатора
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const renderer = new RasterRenderer(canvasRef.current);
    rendererRef.current = renderer;
    
    drawAllShapes();
    
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Перерисовка при изменении фигур
  useEffect(() => {
    drawAllShapes();
  }, [shapes, drawAllShapes]);

  // Hit testing через растеризатор (инверсия матрицы)
  const hitTest = useCallback((shape: Shape, mouseX: number, mouseY: number): boolean => {
    // Для простоты пока используем простую проверку
    // В полной версии нужно использовать матрицы как в 3-й лабе
    if (shape.type === 'circle' && shape.points.length >= 2) {
      const center = shape.points[0];
      const radius = Math.sqrt(
        Math.pow(shape.points[1].x - center.x, 2) + 
        Math.pow(shape.points[1].y - center.y, 2)
      );
      const dx = mouseX - center.x;
      const dy = mouseY - center.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    }
    else if (shape.type === 'square' && shape.points.length >= 2) {
      const p1 = shape.points[0];
      const p2 = shape.points[1];
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const w = Math.abs(p2.x - p1.x);
      const h = Math.abs(p2.y - p1.y);
      return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    }
    else if (shape.type === 'line' && shape.points.length >= 2) {
      // Упрощенная проверка для линии
      const p1 = shape.points[0];
      const p2 = shape.points[1];
      const dist = Math.abs((p2.y - p1.y) * mouseX - (p2.x - p1.x) * mouseY + p2.x * p1.y - p2.y * p1.x) /
                   Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
      return dist < 5;
    }
    return false;
  }, []);

  // Обработка клика по холсту
  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) * (rendererRef.current?.dpr || 1);
    const y = (e.clientY - rect.top) * (rendererRef.current?.dpr || 1);
    
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTest(shapes[i], x, y)) {
        onSelectShape(shapes[i].id);
        return;
      }
    }
    onSelectShape(null);
  };

  // Начало перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) * (rendererRef.current?.dpr || 1);
    const y = (e.clientY - rect.top) * (rendererRef.current?.dpr || 1);
    
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTest(shapes[i], x, y)) {
        setIsDragging(true);
        setDragShapeId(shapes[i].id);
        setDragShapeStart({ ...shapes[i] });
        setDragStart({ x, y });
        onSelectShape(shapes[i].id);
        return;
      }
    }
  };

  // Перемещение
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragShapeId || !dragShapeStart) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = (e.clientX - rect.left) * (rendererRef.current?.dpr || 1);
    const currentY = (e.clientY - rect.top) * (rendererRef.current?.dpr || 1);
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    
    // Обновляем позицию фигуры
    const updatedShape = { ...dragShapeStart };
    updatedShape.points = dragShapeStart.points.map(p => ({
      x: p.x + deltaX,
      y: p.y + deltaY
    }));
    
    onUpdateShape(dragShapeId, updatedShape);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragShapeId(null);
    setDragShapeStart(null);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#1a1a1a' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDragging ? 'grabbing' : 'crosshair'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default CanvasScene;