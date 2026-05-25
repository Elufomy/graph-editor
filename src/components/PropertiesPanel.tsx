import React from 'react';
import { Shape } from '../types/shared';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  onUpdate: (prop: string, value: any) => void;
  onDelete: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedShape,
  onUpdate,
  onDelete,
}) => {
  if (!selectedShape) {
    return (
      <div className="properties-panel">
        <div className="panel-title">Свойства</div>
        <div className="prop-empty">Выберите фигуру для редактирования</div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="panel-title">Свойства</div>
      <div className="properties-content">
        <div className="prop-group">
          <label>Название</label>
          <input
            type="text"
            value={selectedShape.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="prop-input"
          />
        </div>
        <div className="prop-group">
          <label>Тип</label>
          <div className="prop-value">
            {selectedShape.type === 'circle' && 'Круг'}
            {selectedShape.type === 'square' && 'Квадрат'}
            {selectedShape.type === 'polygon' && 'Многоугольник'}
            {selectedShape.type === 'line' && 'Линия'}
            {selectedShape.type === 'freehand' && 'Рисунок'}
          </div>
        </div>
        <div className="prop-group">
          <label>Цвет</label>
          <input
            type="color"
            value={selectedShape.color}
            onChange={(e) => onUpdate('color', e.target.value)}
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
              value={selectedShape.opacity}
              onChange={(e) => onUpdate('opacity', parseFloat(e.target.value))}
            />
            <span>{Math.round(selectedShape.opacity * 100)}%</span>
          </div>
        </div>
        <div className="prop-group">
          <label>Толщина</label>
          <div className="prop-slider">
            <input
              type="range"
              min="1"
              max="20"
              value={selectedShape.thickness}
              onChange={(e) => onUpdate('thickness', parseInt(e.target.value))}
            />
            <span>{selectedShape.thickness}px</span>
          </div>
        </div>
        <button className="delete-btn" onClick={onDelete}>Удалить фигуру</button>
      </div>
    </div>
  );
};