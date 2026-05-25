import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shape, ToolType, getNextName, getBounds } from '../types/shared';
import { useShapeRenderer } from '../hooks/useShapeRenderer';
import { Toolbar } from '../components/Toolbar';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { LayersPanel } from '../components/LayersPanel';
import './RasterLab.css';

const RasterLab: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  const [currentTool, setCurrentTool] = useState<ToolType>('circle');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [currentOpacity, setCurrentOpacity] = useState(1);
  const [currentThickness, setCurrentThickness] = useState(3);
  const [isFilled, setIsFilled] = useState(true);
  const [lineAlgorithm, setLineAlgorithm] = useState<'bresenham' | 'wu'>('bresenham');
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [tempPoints, setTempPoints] = useState<{ x: number; y: number }[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragShapeStart, setDragShapeStart] = useState<{ x: number; y: number }[]>([]);

  const { drawAllShapes } = useShapeRenderer(ctxRef, canvasRef);

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  // инициализация канвас
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(600, rect.width - 40);
      canvas.height = Math.max(400, rect.height - 40);
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
      
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // перерисовка
  useEffect(() => {
    drawAllShapes(shapes, selectedShapeId, currentShape, tempPoints, lineAlgorithm);
  }, [shapes, selectedShapeId, currentShape, tempPoints, lineAlgorithm, drawAllShapes]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startShape = (e: React.MouseEvent) => {
    if (currentTool === 'select') return;
    e.stopPropagation();
    const pos = getMousePos(e);
    
    // проверка
    for (let i = shapes.length - 1; i >= 0; i--) {
      const bounds = getBounds(shapes[i].points);
      if (pos.x >= bounds.minX - 10 && pos.x <= bounds.maxX + 10 && 
          pos.y >= bounds.minY - 10 && pos.y <= bounds.maxY + 10) {
        return;
      }
    }
    
    const newShape: Shape = {
      id: Date.now().toString(),
      name: getNextName(shapes, currentTool),
      type: currentTool,
      points: [pos],
      color: currentColor,
      opacity: currentOpacity,
      thickness: currentThickness,
      isFilled: currentTool !== 'line' && isFilled
    };
    
    setCurrentShape(newShape);
    setIsDrawing(true);
    setTempPoints([]);
  };
  
  const updateShape = (e: React.MouseEvent) => {
    if (!isDrawing || !currentShape) return;
    e.preventDefault();
    const pos = getMousePos(e);
    
    if (currentShape.type === 'circle') {
      setCurrentShape({ ...currentShape, points: [currentShape.points[0], pos] });
    } else if (currentShape.type === 'line') {
      setTempPoints([pos]);
    } else if (currentShape.type === 'freehand') {
      setTempPoints(prev => [...prev, pos]);
    } else if (currentShape.type === 'square') {
      setTempPoints([pos]);
    }
  };
  
  const finishShape = () => {
    if (!currentShape) return;
    
    let finalShape: Shape | null = null;
    
    if (currentShape.type === 'circle' && currentShape.points.length >= 2) {
      finalShape = currentShape;
    } else if (currentShape.type === 'line' && currentShape.points.length === 1 && tempPoints.length > 0) {
      finalShape = { ...currentShape, points: [currentShape.points[0], tempPoints[0]] };
    } else if (currentShape.type === 'freehand' && currentShape.points.length >= 1 && tempPoints.length > 0) {
      finalShape = { ...currentShape, points: [...currentShape.points, ...tempPoints] };
    } else if (currentShape.type === 'square' && currentShape.points.length === 1 && tempPoints.length > 0) {
      finalShape = { ...currentShape, points: [currentShape.points[0], tempPoints[0]] };
    }
    
    if (finalShape && finalShape.points.length >= 2) {
      setShapes(prev => [...prev, finalShape!]);
      setSelectedShapeId(finalShape!.id);
    }
    
    setCurrentShape(null);
    setIsDrawing(false);
    setTempPoints([]);
  };
  
  const deleteShape = (id: string) => {
    setShapes(prev => prev.filter(s => s.id !== id));
    if (selectedShapeId === id) setSelectedShapeId(null);
  };
  
  const renameShape = (id: string, name: string) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };
  
  const updateShapeProperty = (prop: string, value: any) => {
    if (!selectedShapeId) return;
    setShapes(prev => prev.map(s => s.id === selectedShapeId ? { ...s, [prop]: value } : s));
  };
  
  const startDragShape = (e: React.MouseEvent) => {
    if (currentTool !== 'select') return;
    const pos = getMousePos(e);
    for (let i = shapes.length - 1; i >= 0; i--) {
      const bounds = getBounds(shapes[i].points);
      if (pos.x >= bounds.minX - 10 && pos.x <= bounds.maxX + 10 && 
          pos.y >= bounds.minY - 10 && pos.y <= bounds.maxY + 10) {
        setIsDragging(true);
        setSelectedShapeId(shapes[i].id);
        setDragStart(pos);
        setDragShapeStart(shapes[i].points.map(p => ({ ...p })));
        break;
      }
    }
  };
  
  const onDragShape = (e: React.MouseEvent) => {
    if (!isDragging || !selectedShapeId) return;
    const pos = getMousePos(e);
    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;
    setShapes(prev => prev.map(s => s.id === selectedShapeId ? {
      ...s,
      points: dragShapeStart.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }))
    } : s));
  };
  
  const endDragShape = () => {
    setIsDragging(false);
    setDragShapeStart([]);
  };

  return (
    <div className="raster-lab">
      <header className="raster-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Назад к проектам</button>
        <h1>Лабораторная работа №4</h1>
        <h2>Растеризатор</h2>
      </header>
      
      <div className="raster-content">
        <div className="raster-canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="raster-canvas"
            onMouseDown={(e) => {
              if (currentTool === 'select') {
                startDragShape(e);
              } else {
                startShape(e);
              }
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                onDragShape(e);
                drawAllShapes(shapes, selectedShapeId, currentShape, tempPoints, lineAlgorithm);
              } else if (isDrawing) {
                updateShape(e);
                drawAllShapes(shapes, selectedShapeId, currentShape, tempPoints, lineAlgorithm);
              }
            }}
            onMouseUp={() => {
              if (isDragging) {
                endDragShape();
              } else if (isDrawing) {
                finishShape();
              }
              drawAllShapes(shapes, selectedShapeId, currentShape, tempPoints, lineAlgorithm);
            }}
          />
        </div>
        
        <div className="raster-info-panel">
          <div className="info-section">
            <h3>Алгоритм линий</h3>
            <div className="alg-buttons">
              <button className={lineAlgorithm === 'bresenham' ? 'active' : ''} onClick={() => setLineAlgorithm('bresenham')}>
                Брезенхем (ступенчатые)
              </button>
              <button className={lineAlgorithm === 'wu' ? 'active' : ''} onClick={() => setLineAlgorithm('wu')}>
                Ву (сглаженные)
              </button>
            </div>
          </div>
        </div>
        
        <LayersPanel
          layers={shapes}
          selectedId={selectedShapeId}
          onSelect={setSelectedShapeId}
          onDelete={deleteShape}
          onRename={renameShape}
        />
        
        <PropertiesPanel
          selectedShape={selectedShape}
          onUpdate={updateShapeProperty}
          onDelete={() => selectedShapeId && deleteShape(selectedShapeId)}
        />
      </div>
      
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        currentOpacity={currentOpacity}
        onOpacityChange={setCurrentOpacity}
        currentThickness={currentThickness}
        onThicknessChange={setCurrentThickness}
        isFilled={isFilled}
        onFilledChange={setIsFilled}
      />
    </div>
  );
};

export default RasterLab;