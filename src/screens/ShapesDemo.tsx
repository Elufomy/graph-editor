import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rect, Oval, Line, Triangle, QuadraticBezier, CubicBezier, 
  Shape, Point 
} from '../shapes';
import { RasterRenderer } from '../lib/raster/RasterRenderer';
import './ShapesDemo.css';

type ToolType = 'select' | 'rect' | 'oval' | 'line' | 'triangle' | 'quadratic' | 'cubic';

const ShapesDemo: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>('rect');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [currentOpacity, setCurrentOpacity] = useState(0.8);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(3);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawEnd, setDrawEnd] = useState({ x: 0, y: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragShapeId, setDragShapeId] = useState<string | null>(null);
  const [dragStartTransform, setDragStartTransform] = useState({ x: 0, y: 0 });
  
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [rotateShapeId, setRotateShapeId] = useState<string | null>(null);
  const [rotateStartRotation, setRotateStartRotation] = useState(0);
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeShapeId, setResizeShapeId] = useState<string | null>(null);
  const [resizeStartBounds, setResizeStartBounds] = useState({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  const [resizeStartPoint, setResizeStartPoint] = useState({ x: 0, y: 0 });
  
  const [editingPointIndex, setEditingPointIndex] = useState<number | null>(null);
  
  const selectedShape = shapes.find(s => s.id === selectedId);
  const selectedIndex = shapes.findIndex(s => s.id === selectedId);

  // инициализация
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const renderer = new RasterRenderer(canvasRef.current);
    rendererRef.current = renderer;
    
    const updateSize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      rendererRef.current.width = rect.width;
      rendererRef.current.height = rect.height;
      rendererRef.current.resize();
      
      const canvas = canvasRef.current;
      if (canvas) {
        ctxRef.current = canvas.getContext('2d');
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // отрисовка
  useEffect(() => {
    if (!rendererRef.current) return;
    
    const r = rendererRef.current;
    r.beginFrame(true);
    
    const ctx = (r as any).ctx;
    if (ctx) {
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < r.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, r.height);
        ctx.stroke();
      }
      for (let y = 0; y < r.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(r.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    
    // рисовка в порядке массва
    for (const shape of shapes) {
      shape.drawRaster(r);
    }
    
    r.commit();
    
    // маркеры
    if (selectedShape && ctxRef.current) {
      const ctx2 = ctxRef.current;
      const bounds = selectedShape.getBounds();
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      
      ctx2.save();
      
      // пунктир-выделение
      ctx2.strokeStyle = '#0d99ff';
      ctx2.lineWidth = 2;
      ctx2.setLineDash([5, 5]);
      ctx2.strokeRect(bounds.minX - 5, bounds.minY - 5, width + 10, height + 10);
      ctx2.setLineDash([]);
      
      // маркеры 8шт
      const markerSize = 8;
      const markers = [
        { x: bounds.minX - markerSize/2, y: bounds.minY - markerSize/2, handle: 'nw' },
        { x: centerX - markerSize/2, y: bounds.minY - markerSize/2, handle: 'n' },
        { x: bounds.maxX - markerSize/2, y: bounds.minY - markerSize/2, handle: 'ne' },
        { x: bounds.maxX - markerSize/2, y: centerY - markerSize/2, handle: 'e' },
        { x: bounds.maxX - markerSize/2, y: bounds.maxY - markerSize/2, handle: 'se' },
        { x: centerX - markerSize/2, y: bounds.maxY - markerSize/2, handle: 's' },
        { x: bounds.minX - markerSize/2, y: bounds.maxY - markerSize/2, handle: 'sw' },
        { x: bounds.minX - markerSize/2, y: centerY - markerSize/2, handle: 'w' }
      ];
      
      ctx2.fillStyle = '#ffffff';
      ctx2.strokeStyle = '#0d99ff';
      ctx2.lineWidth = 2;
      
      for (const marker of markers) {
        ctx2.fillRect(marker.x, marker.y, markerSize, markerSize);
        ctx2.strokeRect(marker.x, marker.y, markerSize, markerSize);
      }
      
      // маркер аоворота
      const rotateY = bounds.minY - 25;
      ctx2.beginPath();
      ctx2.arc(centerX, rotateY, 8, 0, Math.PI * 2);
      ctx2.fillStyle = '#ffffff';
      ctx2.fill();
      ctx2.strokeStyle = '#0d99ff';
      ctx2.stroke();
      
      ctx2.beginPath();
      ctx2.moveTo(centerX, bounds.minY);
      ctx2.lineTo(centerX, rotateY + 6);
      ctx2.stroke();
      
      ctx2.restore();
    }
  }, [shapes, selectedShape]);

  const getMouseCoords = (e: React.MouseEvent): Point => {
    if (!canvasRef.current || !rendererRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = rendererRef.current.dpr;
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr
    };
  };

  // хит тест
  const hitTest = (x: number, y: number): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].hitTest(x, y)) {
        return shapes[i];
      }
    }
    return null;
  };

  const hitTestMarkers = (x: number, y: number, shape: Shape): string | null => {
    const bounds = shape.getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const markerSize = 8;
    
    const markers = [
      { x: bounds.minX - markerSize/2, y: bounds.minY - markerSize/2, handle: 'nw' },
      { x: centerX - markerSize/2, y: bounds.minY - markerSize/2, handle: 'n' },
      { x: bounds.maxX - markerSize/2, y: bounds.minY - markerSize/2, handle: 'ne' },
      { x: bounds.maxX - markerSize/2, y: centerY - markerSize/2, handle: 'e' },
      { x: bounds.maxX - markerSize/2, y: bounds.maxY - markerSize/2, handle: 'se' },
      { x: centerX - markerSize/2, y: bounds.maxY - markerSize/2, handle: 's' },
      { x: bounds.minX - markerSize/2, y: bounds.maxY - markerSize/2, handle: 'sw' },
      { x: bounds.minX - markerSize/2, y: centerY - markerSize/2, handle: 'w' }
    ];
    
    for (const marker of markers) {
      if (x >= marker.x && x <= marker.x + markerSize && y >= marker.y && y <= marker.y + markerSize) {
        return marker.handle;
      }
    }
    
    const rotateY = bounds.minY - 25;
    const distToRotate = Math.hypot(x - centerX, y - rotateY);
    if (distToRotate < 10) {
      return 'rotate';
    }
    
    return null;
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (currentTool === 'select') return;
    const pos = getMouseCoords(e);
    setDrawStart(pos);
    setDrawEnd(pos);
    setIsDrawing(true);
  };

  const updateDrawing = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getMouseCoords(e);
    setDrawEnd(pos);
  };

  const finishDrawing = () => {
    if (!isDrawing || currentTool === 'select') {
      setIsDrawing(false);
      return;
    }
    
    const width = Math.abs(drawEnd.x - drawStart.x);
    const height = Math.abs(drawEnd.y - drawStart.y);
    const centerX = (drawStart.x + drawEnd.x) / 2;
    const centerY = (drawStart.y + drawEnd.y) / 2;
    
    let newShape: Shape | null = null;
    
    switch (currentTool) {
      case 'rect':
        newShape = new Rect(Math.max(20, width), Math.max(20, height));
        break;
      case 'oval':
        newShape = new Oval(Math.max(10, width / 2), Math.max(10, height / 2));
        break;
      case 'line':
        newShape = new Line(-width/2, 0, width/2, 0);
        break;
      case 'triangle':
        newShape = new Triangle();
        const scaleX = width / 70;
        const scaleY = height / 60;
        newShape.transform.scaleX = scaleX;
        newShape.transform.scaleY = scaleY;
        break;
      case 'quadratic':
        newShape = new QuadraticBezier(
          { x: -width/2, y: 0 },
          { x: 0, y: height/2 },
          { x: width/2, y: 0 }
        );
        break;
      case 'cubic':
        newShape = new CubicBezier(
          { x: -width/2, y: 0 },
          { x: -width/4, y: height/2 },
          { x: width/4, y: height/2 },
          { x: width/2, y: 0 }
        );
        break;
    }
    
    if (newShape) {
      newShape.transform.x = centerX;
      newShape.transform.y = centerY;
      newShape.fillStyle = currentColor;
      newShape.fillOpacity = currentOpacity;
      newShape.strokeWidth = currentStrokeWidth;
      setShapes([...shapes, newShape]);
      setSelectedId(newShape.id);
    }
    
    setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool !== 'select') {
      startDrawing(e);
      return;
    }
    
    const pos = getMouseCoords(e);
    
    // проверка маркеров
    if (selectedShape) {
      const marker = hitTestMarkers(pos.x, pos.y, selectedShape);
      if (marker === 'rotate') {
        const bounds = selectedShape.getBounds();
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
        setIsRotating(true);
        setRotateShapeId(selectedShape.id);
        setRotateStartAngle(angle);
        setRotateStartRotation(selectedShape.transform.rotation);
        return;
      } else if (marker) {
        const bounds = selectedShape.getBounds();
        setIsResizing(true);
        setResizeHandle(marker);
        setResizeShapeId(selectedShape.id);
        setResizeStartBounds({ ...bounds });
        setResizeStartPoint({ x: pos.x, y: pos.y });
        return;
      }
    }
    
    // проверка фигур
    const hit = hitTest(pos.x, pos.y);
    if (hit) {
      setSelectedId(hit.id);
      setDragShapeId(hit.id);
      setDragStart(pos);
      setDragStartTransform({ x: hit.transform.x, y: hit.transform.y });
      setIsDragging(true);
    } else {
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      updateDrawing(e);
      return;
    }
    
    if (isDragging && dragShapeId) {
      const pos = getMouseCoords(e);
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;
      
      setShapes(shapes.map(shape => {
        if (shape.id !== dragShapeId) return shape;
        shape.transform.x = dragStartTransform.x + deltaX;
        shape.transform.y = dragStartTransform.y + deltaY;
        return shape;
      }));
    }
    
    if (isRotating && rotateShapeId) {
      const pos = getMouseCoords(e);
      const shape = shapes.find(s => s.id === rotateShapeId);
      if (shape) {
        const bounds = shape.getBounds();
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
        const deltaAngle = angle - rotateStartAngle;
        
        setShapes(shapes.map(s => {
          if (s.id !== rotateShapeId) return s;
          s.transform.rotation = rotateStartRotation + deltaAngle;
          return s;
        }));
      }
    }
    
    if (isResizing && resizeShapeId) {
      const pos = getMouseCoords(e);
      const shape = shapes.find(s => s.id === resizeShapeId);
      if (shape) {
        let newBounds = { ...resizeStartBounds };
        const deltaX = pos.x - resizeStartPoint.x;
        const deltaY = pos.y - resizeStartPoint.y;
        
        switch (resizeHandle) {
          case 'nw':
            newBounds.minX = resizeStartBounds.minX + deltaX;
            newBounds.minY = resizeStartBounds.minY + deltaY;
            break;
          case 'n':
            newBounds.minY = resizeStartBounds.minY + deltaY;
            break;
          case 'ne':
            newBounds.maxX = resizeStartBounds.maxX + deltaX;
            newBounds.minY = resizeStartBounds.minY + deltaY;
            break;
          case 'e':
            newBounds.maxX = resizeStartBounds.maxX + deltaX;
            break;
          case 'se':
            newBounds.maxX = resizeStartBounds.maxX + deltaX;
            newBounds.maxY = resizeStartBounds.maxY + deltaY;
            break;
          case 's':
            newBounds.maxY = resizeStartBounds.maxY + deltaY;
            break;
          case 'sw':
            newBounds.minX = resizeStartBounds.minX + deltaX;
            newBounds.maxY = resizeStartBounds.maxY + deltaY;
            break;
          case 'w':
            newBounds.minX = resizeStartBounds.minX + deltaX;
            break;
        }
        
        if (newBounds.maxX - newBounds.minX >= 20 && newBounds.maxY - newBounds.minY >= 20) {
          shape.setBounds(newBounds.minX, newBounds.minY, newBounds.maxX, newBounds.maxY);
          setShapes([...shapes]);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) finishDrawing();
    setIsDragging(false);
    setDragShapeId(null);
    setIsRotating(false);
    setRotateShapeId(null);
    setIsResizing(false);
    setResizeShapeId(null);
    setEditingPointIndex(null);
  };

  const updateSelectedShape = (updates: Partial<Shape>) => {
    if (!selectedId) return;
    setShapes(shapes.map(shape => {
      if (shape.id !== selectedId) return shape;
      Object.assign(shape, updates);
      return shape;
    }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setShapes(shapes.filter(s => s.id !== selectedId));
    setSelectedId(null);
  };

  // перемещение вверх
  const moveLayerUp = () => {
    if (!selectedId) return;
    const index = shapes.findIndex(s => s.id === selectedId);
    if (index < shapes.length - 1) {
      const newShapes = [...shapes];
      [newShapes[index], newShapes[index + 1]] = [newShapes[index + 1], newShapes[index]];
      setShapes(newShapes);
    }
  };

  // перемещение вниз
  const moveLayerDown = () => {
    if (!selectedId) return;
    const index = shapes.findIndex(s => s.id === selectedId);
    if (index > 0) {
      const newShapes = [...shapes];
      [newShapes[index], newShapes[index - 1]] = [newShapes[index - 1], newShapes[index]];
      setShapes(newShapes);
    }
  };

  const startEditPoint = (e: React.MouseEvent, index: number) => {
    if (!selectedShape) return;
    e.stopPropagation();
    setEditingPointIndex(index);
  };

  const onEditPoint = (e: React.MouseEvent) => {
    if (editingPointIndex === null || !selectedShape) return;
    const pos = getMouseCoords(e);
    
    if ('setControlPoint' in selectedShape && typeof (selectedShape as any).setControlPoint === 'function') {
      (selectedShape as any).setControlPoint(editingPointIndex, pos);
      setShapes([...shapes]);
    }
  };

  const getControlPoints = (): Point[] => {
    if (!selectedShape) return [];
    if ('getControlPoints' in selectedShape && typeof (selectedShape as any).getControlPoints === 'function') {
      return (selectedShape as any).getControlPoints();
    }
    return [];
  };

  const getShapeTypeName = (shape: Shape): string => {
    if (shape instanceof Rect) return 'Прямоугольник';
    if (shape instanceof Oval) return 'Эллипс';
    if (shape instanceof Line) return 'Линия';
    if (shape instanceof Triangle) return 'Треугольник';
    if (shape instanceof QuadraticBezier) return 'Квадратичная Безье';
    if (shape instanceof CubicBezier) return 'Кубическая Безье';
    return 'Фигура';
  };

  const tools: { type: ToolType; label: string }[] = [
    { type: 'select', label: 'Выбор' },
    { type: 'rect', label: 'Прямоугольник' },
    { type: 'oval', label: 'Эллипс' },
    { type: 'line', label: 'Линия' },
    { type: 'triangle', label: 'Треугольник' },
    { type: 'quadratic', label: 'Кв. Безье' },
    { type: 'cubic', label: 'Куб. Безье' },
  ];

  return (
    <div className="shapes-demo">
      <header className="demo-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Назад</button>
        <h1>Лабораторные №5 и №6</h1>
        <h2>Редактор фигур</h2>
      </header>
      
      <div className="toolbar">
        {tools.map(tool => (
          <button
            key={tool.type}
            className={`tool-btn ${currentTool === tool.type ? 'active' : ''}`}
            onClick={() => setCurrentTool(tool.type)}
          >
            {tool.label}
          </button>
        ))}
      </div>
      
      <div className="demo-content">
        <div className="canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
        
        <div className="info-panel">
          <div className="panel-section">
            <h3>Инструменты</h3>
            <div className="current-tool">
              Текущий: <strong>{tools.find(t => t.type === currentTool)?.label}</strong>
            </div>
            <div className="color-control">
              <label>Цвет заливки:</label>
              <input 
                type="color" 
                value={currentColor} 
                onChange={(e) => setCurrentColor(e.target.value)}
              />
            </div>
            <div className="opacity-control">
              <label>Прозрачность:</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={currentOpacity} 
                onChange={(e) => setCurrentOpacity(parseFloat(e.target.value))}
              />
              <span>{Math.round(currentOpacity * 100)}%</span>
            </div>
            <div className="stroke-control">
              <label>Толщина линии:</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={currentStrokeWidth} 
                onChange={(e) => setCurrentStrokeWidth(parseInt(e.target.value))}
              />
              <span>{currentStrokeWidth}px</span>
            </div>
          </div>
          
          <div className="panel-section">
            <h3>Список фигур</h3>
            <div className="layer-controls">
              <button 
                className="layer-move-btn" 
                onClick={moveLayerUp}
                disabled={selectedIndex === -1 || selectedIndex === shapes.length - 1}
              >
                ↑ Вверх (выше)
              </button>
              <button 
                className="layer-move-btn" 
                onClick={moveLayerDown}
                disabled={selectedIndex === -1 || selectedIndex === 0}
              >
                ↓ Вниз (ниже)
              </button>
            </div>
            <div className="shapes-list">
              {shapes.length === 0 && <div className="empty">Нет фигур</div>}
              {shapes.map((shape, idx) => {
                const isSelected = selectedId === shape.id;
                return (
                  <div 
                    key={shape.id} 
                    className={`shape-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedId(shape.id)}
                  >
                    <span className="shape-name">
                      {idx + 1}. {getShapeTypeName(shape)}
                    </span>
                    <button 
                      className="shape-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShapes(shapes.filter(s => s.id !== shape.id));
                        if (selectedId === shape.id) setSelectedId(null);
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="layer-hint">
              <small>↑ Вверх</small>
              <br />
              <small>↓ Вниз</small>
            </div>
          </div>
          
          {selectedShape && (
            <div className="panel-section">
              <h3>Свойства фигуры</h3>
              <div className="prop">
                <label>Тип:</label>
                <span>{getShapeTypeName(selectedShape)}</span>
              </div>
              <div className="prop">
                <label>Позиция X:</label>
                <input 
                  type="number" 
                  value={Math.round(selectedShape.transform.x)} 
                  onChange={(e) => updateSelectedShape({ 
                    transform: { ...selectedShape.transform, x: parseFloat(e.target.value) } 
                  })}
                />
              </div>
              <div className="prop">
                <label>Позиция Y:</label>
                <input 
                  type="number" 
                  value={Math.round(selectedShape.transform.y)} 
                  onChange={(e) => updateSelectedShape({ 
                    transform: { ...selectedShape.transform, y: parseFloat(e.target.value) } 
                  })}
                />
              </div>
              <div className="prop">
                <label>Поворот:</label>
                <input 
                  type="number" 
                  step="1"
                  value={Math.round(selectedShape.transform.rotation * 180 / Math.PI)} 
                  onChange={(e) => updateSelectedShape({ 
                    transform: { ...selectedShape.transform, rotation: parseFloat(e.target.value) * Math.PI / 180 } 
                  })}
                />
                <span>°</span>
              </div>
              <div className="prop">
                <label>Масштаб X:</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={selectedShape.transform.scaleX} 
                  onChange={(e) => updateSelectedShape({ 
                    transform: { ...selectedShape.transform, scaleX: parseFloat(e.target.value) } 
                  })}
                />
              </div>
              <div className="prop">
                <label>Масштаб Y:</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={selectedShape.transform.scaleY} 
                  onChange={(e) => updateSelectedShape({ 
                    transform: { ...selectedShape.transform, scaleY: parseFloat(e.target.value) } 
                  })}
                />
              </div>
              <div className="prop">
                <label>Цвет:</label>
                <input 
                  type="color" 
                  value={selectedShape.fillStyle} 
                  onChange={(e) => updateSelectedShape({ fillStyle: e.target.value })}
                />
              </div>
              <div className="prop">
                <label>Прозрачность:</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  value={selectedShape.fillOpacity} 
                  onChange={(e) => updateSelectedShape({ fillOpacity: parseFloat(e.target.value) })}
                />
                <span>{Math.round(selectedShape.fillOpacity * 100)}%</span>
              </div>
              {(selectedShape instanceof QuadraticBezier || selectedShape instanceof CubicBezier) && (
                <div className="prop">
                  <label>Контрольные точки:</label>
                  <div className="control-points">
                    {getControlPoints().map((point, idx) => (
                      <div 
                        key={idx} 
                        className="control-point"
                        onMouseDown={(e) => startEditPoint(e, idx)}
                      >
                        P{idx}: ({Math.round(point.x)}, {Math.round(point.y)})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button className="delete-btn" onClick={deleteSelected}>Удалить фигуру</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShapesDemo;