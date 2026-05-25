import React, { useEffect, useRef } from 'react';
import { RasterRenderer, RGBA, hexToRGBA } from '../lib/raster/RasterRenderer';
import { Shape, Rect, Oval, Line, Triangle, QuadraticBezier, CubicBezier } from '../shapes';

interface ShapeCanvasProps {
  shapes: Shape[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, shape: Shape) => void;
}

const ShapeCanvas: React.FC<ShapeCanvasProps> = ({ shapes, selectedId, onSelect, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Инициализация растеризатора
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const renderer = new RasterRenderer(canvasRef.current);
    rendererRef.current = renderer;
    
    const resize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      rendererRef.current.width = rect.width;
      rendererRef.current.height = rect.height;
      rendererRef.current.resize();
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    return () => {
      window.removeEventListener('resize', resize);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // Отрисовка всех фигур
  useEffect(() => {
    if (!rendererRef.current) return;
    
    const r = rendererRef.current;
    r.beginFrame(true);
    
    for (const shape of shapes) {
      shape.drawRaster(r);
    }
    
    r.commit();
  }, [shapes]);

  // Hit test и выделение
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !rendererRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = rendererRef.current.dpr;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    
    // Идём с конца (верхние слои)
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].hitTest(x, y)) {
        onSelect(shapes[i].id);
        return;
      }
    }
    onSelect(null);
  };

  // Перемещение фигуры
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !rendererRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = rendererRef.current.dpr;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].hitTest(x, y)) {
        onSelect(shapes[i].id);
        // Здесь будет логика перетаскивания
        break;
      }
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default ShapeCanvas;