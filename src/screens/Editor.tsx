import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mat3, Mat3 } from '../lib/math/mat3';
import './Editor.css';

type ShapeType = 'square' | 'circle' | 'line' | 'brush';

interface Layer {
  id: string;
  name: string;
  type: ShapeType;
  matrix: Mat3;
  width: number;
  height: number;
  color: string;
  opacity: number;
  points?: { x: number; y: number }[];
  strokePoints?: { x: number; y: number }[];
}

const extractTransform = (matrix: Mat3): { tx: number; ty: number; rotation: number; sx: number; sy: number } => {
  const a = matrix[0];
  const b = matrix[1];
  const tx = matrix[2];
  const c = matrix[3];
  const d = matrix[4];
  const ty = matrix[5];
  
  return {
    tx, ty,
    sx: Math.sqrt(a * a + c * c),
    sy: Math.sqrt(b * b + d * d),
    rotation: Math.atan2(c, a)
  };
};

const createMatrix = (tx: number, ty: number, rotation: number, sx: number, sy: number): Mat3 => 
  mat3.fromTransform(tx, ty, rotation, sx, sy);

const getWorldCenter = (layer: Layer): { x: number; y: number } => {
  // const { tx, ty } = extractTransform(layer.matrix);
  const localCenter = { x: layer.width / 2, y: layer.height / 2 };
  return mat3.transformPoint(layer.matrix, localCenter.x, localCenter.y);
};

const Editor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<SVGSVGElement>(null);
  
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ShapeType | 'select'>('select');
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  
  // рисование линии
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState({ x: 0, y: 0 });
  
  // рисование кистью
  const [isDrawingBrush, setIsDrawingBrush] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  
  // Трансформации
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartMatrix, setDragStartMatrix] = useState<Mat3 | null>(null);
  
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [rotateStartMatrix, setRotateStartMatrix] = useState<Mat3 | null>(null);
  
  const [isScaling, setIsScaling] = useState(false);
  const [scaleStart, setScaleStart] = useState({ x: 0, y: 0 });
  const [scaleStartMatrix, setScaleStartMatrix] = useState<Mat3 | null>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const getNextName = (type: ShapeType) => {
    const count = layers.filter(l => l.type === type).length;
    if (type === 'square') return `Квадрат ${count + 1}`;
    if (type === 'circle') return `Круг ${count + 1}`;
    if (type === 'line') return `Линия ${count + 1}`;
    return `Рисунок ${count + 1}`;
  };

  const addShape = useCallback((type: ShapeType, x: number, y: number) => {
    if (type === 'line') {
      setIsDrawingLine(true);
      setLineStart({ x, y });
      return;
    }
    
    if (type === 'brush') {
      return;
    }
    
    const size = type === 'square' ? 80 : 70;
    const newLayer: Layer = {
      id: Date.now().toString(),
      name: getNextName(type),
      type,
      matrix: mat3.translate(x - size / 2, y - size / 2),
      width: size,
      height: size,
      color: '#4a5568',
      opacity: 0.9
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, []);

  const finishLine = useCallback((x: number, y: number) => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      name: getNextName('line'),
      type: 'line',
      matrix: mat3.identity(),
      width: 0,
      height: 0,
      color: '#4a5568',
      opacity: 0.9,
      points: [lineStart, { x, y }]
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setIsDrawingLine(false);
  }, [lineStart]);

  const finishBrushStroke = useCallback(() => {
    if (currentStroke.length < 2) return;
    
    const newLayer: Layer = {
      id: Date.now().toString(),
      name: getNextName('brush'),
      type: 'brush',
      matrix: mat3.identity(),
      width: 0,
      height: 0,
      color: '#4a5568',
      opacity: 0.9,
      strokePoints: [...currentStroke]
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setCurrentStroke([]);
  }, [currentStroke]);

  const hitTest = useCallback((layer: Layer, mouseX: number, mouseY: number): boolean => {
    if (layer.type === 'brush' && layer.strokePoints) {
      for (let i = 0; i < layer.strokePoints.length - 1; i++) {
        const p1 = layer.strokePoints[i];
        const p2 = layer.strokePoints[i + 1];
        const dist = Math.abs((p2.y - p1.y) * mouseX - (p2.x - p1.x) * mouseY + p2.x * p1.y - p2.y * p1.x) /
                     Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
        if (dist < brushSize) return true;
      }
      return false;
    }
    
    if (layer.type === 'line' && layer.points && layer.points.length >= 2) {
      const p1 = layer.points[0];
      const p2 = layer.points[1];
      const dist = Math.abs((p2.y - p1.y) * mouseX - (p2.x - p1.x) * mouseY + p2.x * p1.y - p2.y * p1.x) /
                   Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
      return dist < 8;
    }
    
    const invMatrix = mat3.invert(layer.matrix);
    if (!invMatrix) return false;
    const local = mat3.transformPoint(invMatrix, mouseX, mouseY);
    const halfW = layer.width / 2;
    const halfH = layer.height / 2;
    return layer.type === 'square'
      ? local.x >= -halfW && local.x <= halfW && local.y >= -halfH && local.y <= halfH
      : (local.x * local.x) / (halfW * halfW) + (local.y * local.y) / (halfH * halfH) <= 1;
  }, [brushSize]);

  // перемещение
  const startDrag = (e: React.MouseEvent, layer: Layer) => {
    if (selectedTool !== 'select') return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartMatrix([...layer.matrix]);
    setSelectedLayerId(layer.id);
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging || !selectedLayerId || !dragStartMatrix) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const translation = mat3.translate(deltaX, deltaY);
    const newMatrix = mat3.multiply(translation, dragStartMatrix);
    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, matrix: newMatrix } : l));
  };

  // поворот
  const startRotate = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const center = getWorldCenter(layer);
    const angle = Math.atan2(e.clientY - rect.top - center.y, e.clientX - rect.left - center.x);
    setIsRotating(true);
    setRotateStartAngle(angle);
    setRotateStartMatrix([...layer.matrix]);
    setRotateCenter(center);
    setSelectedLayerId(layer.id);
  };

  const onRotate = (e: React.MouseEvent) => {
    if (!isRotating || !selectedLayerId || !rotateStartMatrix) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer) return;
    const center = getWorldCenter(layer);
    const angle = Math.atan2(e.clientY - rect.top - center.y, e.clientX - rect.left - center.x);
    const deltaAngle = angle - rotateStartAngle;
    const { tx, ty, sx, sy } = extractTransform(rotateStartMatrix);
    const currentRotation = extractTransform(rotateStartMatrix).rotation;
    const newMatrix = createMatrix(tx, ty, currentRotation + deltaAngle, sx, sy);
    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, matrix: newMatrix } : l));
  };

  // масштабирование
  const startScale = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    setIsScaling(true);
    setScaleStart({ x: e.clientX, y: e.clientY });
    setScaleStartMatrix([...layer.matrix]);
    setSelectedLayerId(layer.id);
  };

  const onScale = (e: React.MouseEvent) => {
    if (!isScaling || !selectedLayerId || !scaleStartMatrix) return;
    const deltaX = e.clientX - scaleStart.x;
    const deltaY = e.clientY - scaleStart.y;
    const scaleFactor = 1 + (deltaX + deltaY) * 0.005;
    const { tx, ty, rotation, sx, sy } = extractTransform(scaleStartMatrix);
    const newSx = Math.max(0.1, sx * scaleFactor);
    const newSy = Math.max(0.1, sy * scaleFactor);
    const newMatrix = createMatrix(tx, ty, rotation, newSx, newSy);
    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, matrix: newMatrix } : l));
  };

  const endTransform = () => {
    setIsDragging(false);
    setIsRotating(false);
    setIsScaling(false);
    setDragStartMatrix(null);
    setRotateStartMatrix(null);
    setScaleStartMatrix(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    if (selectedTool === 'brush') {
      setIsDrawingBrush(true);
      setCurrentStroke([{ x: mx, y: my }]);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    if (isDrawingBrush && selectedTool === 'brush') {
      setCurrentStroke(prev => [...prev, { x: mx, y: my }]);
    }
    
    onDrag(e);
    onRotate(e);
    onScale(e);
  };

  const handleCanvasMouseUp = () => {
    if (isDrawingBrush && selectedTool === 'brush') {
      finishBrushStroke();
      setIsDrawingBrush(false);
    }
    endTransform();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    if (isDrawingLine && selectedTool === 'line') {
      finishLine(mx, my);
      return;
    }
    
    if (selectedTool !== 'select' && selectedTool !== 'brush') {
      addShape(selectedTool, mx, my);
      return;
    }
    
    if (selectedTool === 'select') {
      for (let i = layers.length - 1; i >= 0; i--) {
        if (hitTest(layers[i], mx, my)) {
          setSelectedLayerId(layers[i].id);
          return;
        }
      }
      setSelectedLayerId(null);
    }
  };

  const updateLayerProperty = (id: string, prop: string, value: any) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id !== id) return layer;
      
      if (prop === 'color') return { ...layer, color: value };
      if (prop === 'opacity') return { ...layer, opacity: Math.max(0, Math.min(1, value)) };
      if (prop === 'name') return { ...layer, name: value };
      
      const { tx, ty, rotation, sx, sy } = extractTransform(layer.matrix);
      const centerX = tx + layer.width / 2;
      const centerY = ty + layer.height / 2;
      
      if (prop === 'x') {
        const newMatrix = createMatrix(value - layer.width / 2, ty, rotation, sx, sy);
        return { ...layer, matrix: newMatrix };
      }
      if (prop === 'y') {
        const newMatrix = createMatrix(tx, value - layer.height / 2, rotation, sx, sy);
        return { ...layer, matrix: newMatrix };
      }
      if (prop === 'rotation') {
        const newMatrix = createMatrix(tx, ty, value * Math.PI / 180, sx, sy);
        return { ...layer, matrix: newMatrix };
      }
      if (prop === 'width') {
        const w = Math.max(20, value);
        const newMatrix = createMatrix(centerX - w / 2, ty, rotation, sx, sy);
        return { ...layer, width: w, matrix: newMatrix };
      }
      if (prop === 'height') {
        const h = Math.max(20, value);
        const newMatrix = createMatrix(tx, centerY - h / 2, rotation, sx, sy);
        return { ...layer, height: h, matrix: newMatrix };
      }
      
      return layer;
    }));
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const renderShape = (layer: Layer) => {
    const isSelected = selectedLayerId === layer.id;
    const fillColor = `rgba(${parseInt(layer.color.slice(1, 3), 16)}, ${parseInt(layer.color.slice(3, 5), 16)}, ${parseInt(layer.color.slice(5, 7), 16)}, ${layer.opacity})`;
    
    if (layer.type === 'line' && layer.points && layer.points.length >= 2) {
      const p1 = layer.points[0];
      const p2 = layer.points[1];
      return (
        <line
          key={layer.id}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={fillColor}
          strokeWidth={2}
          strokeLinecap="round"
          onClick={() => setSelectedLayerId(layer.id)}
          style={{ cursor: 'pointer' }}
        />
      );
    }
    
    if (layer.type === 'brush' && layer.strokePoints && layer.strokePoints.length > 1) {
      let path = `M ${layer.strokePoints[0].x} ${layer.strokePoints[0].y}`;
      for (let i = 1; i < layer.strokePoints.length; i++) {
        path += ` L ${layer.strokePoints[i].x} ${layer.strokePoints[i].y}`;
      }
      return (
        <path
          key={layer.id}
          d={path}
          stroke={fillColor}
          strokeWidth={brushSize}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          onClick={() => setSelectedLayerId(layer.id)}
          style={{ cursor: 'pointer' }}
        />
      );
    }
    
    const { tx, ty, rotation, sx, sy } = extractTransform(layer.matrix);
    const transform = `translate(${tx}, ${ty}) scale(${sx}, ${sy}) rotate(${rotation * 180 / Math.PI}, ${layer.width/2}, ${layer.height/2})`;
    const centerX = layer.width / 2;
    const centerY = layer.height / 2;
    
    return (
      <g 
        key={layer.id} 
        transform={transform}
        onMouseDown={(e) => startDrag(e, layer)}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {layer.type === 'square' ? (
          <rect x={0} y={0} width={layer.width} height={layer.height} fill={fillColor} stroke={isSelected ? '#0d99ff' : 'none'} strokeWidth={isSelected ? 2 : 0} />
        ) : (
          <ellipse cx={centerX} cy={centerY} rx={layer.width / 2} ry={layer.height / 2} fill={fillColor} stroke={isSelected ? '#0d99ff' : 'none'} strokeWidth={isSelected ? 2 : 0} />
        )}
        {isSelected && (
          <>
            <circle cx={0} cy={0} r={6} fill="white" stroke="#0d99ff" strokeWidth={2} onMouseDown={(e) => { e.stopPropagation(); startScale(e, layer); }} style={{ cursor: 'nw-resize' }} />
            <circle cx={layer.width} cy={0} r={6} fill="white" stroke="#0d99ff" strokeWidth={2} onMouseDown={(e) => { e.stopPropagation(); startScale(e, layer); }} style={{ cursor: 'ne-resize' }} />
            <circle cx={0} cy={layer.height} r={6} fill="white" stroke="#0d99ff" strokeWidth={2} onMouseDown={(e) => { e.stopPropagation(); startScale(e, layer); }} style={{ cursor: 'sw-resize' }} />
            <circle cx={layer.width} cy={layer.height} r={6} fill="white" stroke="#0d99ff" strokeWidth={2} onMouseDown={(e) => { e.stopPropagation(); startScale(e, layer); }} style={{ cursor: 'se-resize' }} />
            <circle cx={centerX} cy={-20} r={6} fill="white" stroke="#0d99ff" strokeWidth={2} onMouseDown={(e) => { e.stopPropagation(); startRotate(e, layer); }} style={{ cursor: 'grab' }} />
            <line x1={centerX} y1={0} x2={centerX} y2={-15} stroke="#0d99ff" strokeWidth={2} strokeDasharray="4 4" />
          </>
        )}
      </g>
    );
  };

  const selected = selectedLayer;
  const { tx, ty, rotation, sx, sy } = selected ? extractTransform(selected.matrix) : { tx: 0, ty: 0, rotation: 0, sx: 1, sy: 1 };
  const centerX = selected ? tx + selected.width / 2 : 0;
  const centerY = selected ? ty + selected.height / 2 : 0;

  return (
    <div className="editor">
      <header className="editor-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Назад</button>
        <span className="project-name">Проект {id}</span>
        <button className="save-btn">Сохранить</button>
      </header>

      <div className="editor-main">
        <div className="layers-panel">
          <div className="panel-title">Слои</div>
          <div className="layers-list">
            {layers.length === 0 ? (
              <div className="layers-empty">Нет фигур</div>
            ) : (
              layers.map(layer => (
                <div 
                  key={layer.id}
                  className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  <div className="layer-icon">
                    {layer.type === 'square' && '□'}
                    {layer.type === 'circle' && '○'}
                    {layer.type === 'line' && '─'}
                    {layer.type === 'brush' && '✎'}
                  </div>
                  <div className="layer-name">{layer.name}</div>
                  <button 
                    className="layer-delete"
                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="canvas-wrapper">
          <svg 
            ref={canvasRef}
            className="canvas"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{ cursor: selectedTool === 'brush' ? 'crosshair' : (selectedTool !== 'select' ? 'crosshair' : 'default') }}
          >
            {layers.map(renderShape)}
          </svg>
        </div>

        <div className="properties-panel">
          <div className="panel-title">Свойства</div>
          {selected ? (
            <div className="properties-content">
              <div className="prop-group">
                <label>Название</label>
                <input 
                  type="text" 
                  value={selected.name}
                  onChange={(e) => updateLayerProperty(selected.id, 'name', e.target.value)}
                  className="prop-input"
                />
              </div>
              <div className="prop-group">
                <label>Тип</label>
                <div className="prop-value">
                  {selected.type === 'square' && 'Квадрат'}
                  {selected.type === 'circle' && 'Круг'}
                  {selected.type === 'line' && 'Линия'}
                  {selected.type === 'brush' && 'Рисунок от руки'}
                </div>
              </div>
              <div className="prop-group">
                <label>Цвет</label>
                <input 
                  type="color" 
                  value={selected.color}
                  onChange={(e) => updateLayerProperty(selected.id, 'color', e.target.value)}
                  className="prop-color"
                />
              </div>
              <div className="prop-group">
                <label>Прозрачность</label>
                <div className="prop-slider">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={selected.opacity}
                    onChange={(e) => updateLayerProperty(selected.id, 'opacity', parseFloat(e.target.value))}
                  />
                  <span className="prop-value">{Math.round(selected.opacity * 100)}%</span>
                </div>
              </div>
              {selected.type !== 'line' && selected.type !== 'brush' && (
                <>
                  <div className="prop-group">
                    <label>Позиция X</label>
                    <input 
                      type="number" 
                      value={Math.round(centerX)}
                      onChange={(e) => updateLayerProperty(selected.id, 'x', parseFloat(e.target.value))}
                      className="prop-input"
                    />
                  </div>
                  <div className="prop-group">
                    <label>Позиция Y</label>
                    <input 
                      type="number" 
                      value={Math.round(centerY)}
                      onChange={(e) => updateLayerProperty(selected.id, 'y', parseFloat(e.target.value))}
                      className="prop-input"
                    />
                  </div>
                  <div className="prop-group">
                    <label>Ширина</label>
                    <input 
                      type="number" 
                      value={Math.round(selected.width)}
                      onChange={(e) => updateLayerProperty(selected.id, 'width', parseFloat(e.target.value))}
                      className="prop-input"
                    />
                  </div>
                  <div className="prop-group">
                    <label>Высота</label>
                    <input 
                      type="number" 
                      value={Math.round(selected.height)}
                      onChange={(e) => updateLayerProperty(selected.id, 'height', parseFloat(e.target.value))}
                      className="prop-input"
                    />
                  </div>
                  <div className="prop-group">
                    <label>Угол поворота</label>
                    <input 
                      type="number" 
                      value={Math.round(rotation * 180 / Math.PI)}
                      onChange={(e) => updateLayerProperty(selected.id, 'rotation', parseFloat(e.target.value))}
                      className="prop-input"
                    />
                  </div>
                </>
              )}
              <div className="prop-group">
                <label>Размер кисти</label>
                <div className="prop-slider">
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="1"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  />
                  <span className="prop-value">{brushSize}px</span>
                </div>
              </div>
              <button className="delete-btn" onClick={() => deleteLayer(selected.id)}>
                Удалить фигуру
              </button>
            </div>
          ) : (
            <div className="prop-empty">Выберите фигуру для редактирования</div>
          )}
        </div>
      </div>

      <div className="bottom-toolbar">
        <button 
          className={`tool-btn ${selectedTool === 'select' ? 'active' : ''}`}
          onClick={() => setSelectedTool('select')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="M13 13l6 6" />
          </svg>
          <span>Курсор</span>
        </button>
        
        <div className="tool-divider" />
        
        <div className="tool-dropdown">
          <button 
            className={`tool-btn ${selectedTool !== 'select' ? 'active' : ''}`}
            onClick={() => setShowToolMenu(!showToolMenu)}
          >
            {selectedTool === 'square' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" />
              </svg>
            )}
            {selectedTool === 'circle' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
              </svg>
            )}
            {selectedTool === 'line' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            )}
            {selectedTool === 'brush' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              </svg>
            )}
            <span>
              {selectedTool === 'square' && 'Квадрат'}
              {selectedTool === 'circle' && 'Круг'}
              {selectedTool === 'line' && 'Линия'}
              {selectedTool === 'brush' && 'Кисть'}
              {selectedTool === 'select' && 'Фигура'}
            </span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showToolMenu && (
            <div className="dropdown-menu">
              <button onClick={() => { setSelectedTool('square'); setShowToolMenu(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" />
                </svg>
                Квадрат
              </button>
              <button onClick={() => { setSelectedTool('circle'); setShowToolMenu(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="8" />
                </svg>
                Круг
              </button>
              <button onClick={() => { setSelectedTool('line'); setShowToolMenu(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="12" x2="20" y2="12" />
                </svg>
                Линия
              </button>
              <button onClick={() => { setSelectedTool('brush'); setShowToolMenu(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
                Кисть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;