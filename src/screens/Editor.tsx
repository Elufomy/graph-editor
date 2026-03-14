import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Editor.css';

type ShapeType = 'square' | 'circle';

interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const Editor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<ShapeType | 'select'>('select');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Добавление фигуры
  const addShape = (type: ShapeType) => {
    const newShape: Shape = {
      id: Date.now().toString(),
      type,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      width: type === 'square' ? 80 : 70,
      height: type === 'square' ? 80 : 70,
      color: type === 'square' ? '#3b82f6' : '#ef4444'
    };
    setShapes([...shapes, newShape]);
  };

  // Удаление фигуры
  const deleteSelected = () => {
    if (selectedShapeId) {
      setShapes(shapes.filter(s => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  };

  // Обновление позиции
  const updatePosition = (id: string, x: number, y: number) => {
    setShapes(shapes.map(shape =>
      shape.id === id ? { ...shape, x, y } : shape
    ));
  };

  // Изменение цвета
  const updateColor = (color: string) => {
    if (selectedShapeId) {
      setShapes(shapes.map(shape =>
        shape.id === selectedShapeId ? { ...shape, color } : shape
      ));
    }
  };

  // Обработчик клика по холсту (добавление фигуры выбранным инструментом)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (selectedTool === 'select') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 40;
    
    const newShape: Shape = {
      id: Date.now().toString(),
      type: selectedTool,
      x: Math.max(0, Math.min(x, 700)),
      y: Math.max(0, Math.min(y, 500)),
      width: selectedTool === 'square' ? 80 : 70,
      height: selectedTool === 'square' ? 80 : 70,
      color: selectedTool === 'square' ? '#3b82f6' : '#ef4444'
    };
    setShapes([...shapes, newShape]);
  };

  return (
    <div className="editor-container">
      {/* Верхняя панель */}
      <div className="toolbar">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Назад
        </button>
        
        <div className="project-title">
          Проект {id === 'new' ? '(новый)' : `№${id}`}
        </div>
        
        <button className="save-button">
          💾 Сохранить
        </button>
      </div>

      {/* Основная область */}
      <div className="main-area">
        {/* Левая панель инструментов */}
        <div className="tools-panel">
          <button
            className={`tool-button ${selectedTool === 'select' ? 'active' : ''}`}
            onClick={() => setSelectedTool('select')}
            title="Выбор"
          >
            <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              <path d="M13 13l6 6" />
            </svg>
          </button>

          <button
            className={`tool-button ${selectedTool === 'square' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTool('square');
              addShape('square');
            }}
            title="Квадрат"
          >
            <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" />
            </svg>
          </button>

          <button
            className={`tool-button ${selectedTool === 'circle' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTool('circle');
              addShape('circle');
            }}
            title="Круг"
          >
            <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>

          <button
            className="tool-button"
            onClick={deleteSelected}
            title="Удалить"
            style={{ opacity: selectedShapeId ? 1 : 0.5 }}
            disabled={!selectedShapeId}
          >
            <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>

        {/* Центральный холст */}
        <div 
          className="canvas-area"
          onClick={handleCanvasClick}
          style={{ position: 'relative', cursor: selectedTool !== 'select' ? 'crosshair' : 'default' }}
        >
          <svg 
            width="100%" 
            height="100%" 
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {shapes.map(shape => (
              <ShapeComponent
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeId === shape.id}
                onSelect={() => setSelectedShapeId(shape.id)}
                onMove={(x, y) => updatePosition(shape.id, x, y)}
              />
            ))}
          </svg>
        </div>

        {/* Правая панель свойств */}
        <div className="properties-panel">
          <h3 className="properties-title">Свойства</h3>
          
          {selectedShapeId ? (
            <>
              <div className="property-group">
                <label className="property-label">Цвет</label>
                <input 
                  type="color" 
                  className="color-input"
                  value={shapes.find(s => s.id === selectedShapeId)?.color || '#3b82f6'}
                  onChange={(e) => updateColor(e.target.value)}
                />
              </div>

              <div className="property-group">
                <label className="property-label">Размер</label>
                <input 
                  type="range" 
                  min="20" 
                  max="200" 
                  className="range-input"
                  defaultValue="80"
                />
              </div>

              <div className="property-text">
                <p>Тип: {shapes.find(s => s.id === selectedShapeId)?.type === 'square' ? 'Квадрат' : 'Круг'}</p>
              </div>
            </>
          ) : (
            <div className="property-text">
              <p>Выберите фигуру</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент фигуры
const ShapeComponent: React.FC<{
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}> = ({ shape, isSelected, onSelect, onMove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - shape.x,
      y: e.clientY - shape.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    onMove(newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const commonProps = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    style: { cursor: isDragging ? 'grabbing' : 'grab' }
  };

  if (shape.type === 'square') {
    return (
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.color}
        stroke={isSelected ? '#ffff00' : 'none'}
        strokeWidth={isSelected ? 3 : 0}
        {...commonProps}
      />
    );
  } else {
    return (
      <ellipse
        cx={shape.x + shape.width / 2}
        cy={shape.y + shape.height / 2}
        rx={shape.width / 2}
        ry={shape.height / 2}
        fill={shape.color}
        stroke={isSelected ? '#ffff00' : 'none'}
        strokeWidth={isSelected ? 3 : 0}
        {...commonProps}
      />
    );
  }
};

export default Editor;