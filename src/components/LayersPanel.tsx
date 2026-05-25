import React, { useState } from 'react';
import { Shape } from '../types/shared';

interface LayersPanelProps {
  layers: Shape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedId,
  onSelect,
  onDelete,
  onRename,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const getIcon = (type: string) => {
    switch (type) {
      case 'circle': return '⚪';
      case 'square': return '◻️';
      case 'polygon': return '🔺';
      case 'line': return '─';
      case 'freehand': return '✎';
      default: return '□';
    }
  };

  return (
    <div className="layers-panel">
      <div className="panel-title">Слои</div>
      <div className="layers-list">
        {layers.length === 0 ? (
          <div className="layers-empty">Нет фигур</div>
        ) : (
          layers.map(layer => (
            <div
              key={layer.id}
              className={`layer-item ${selectedId === layer.id ? 'selected' : ''}`}
              onClick={() => onSelect(layer.id)}
            >
              <div className="layer-icon">{getIcon(layer.type)}</div>
              {editingId === layer.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (editValue.trim()) onRename(layer.id, editValue);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && editValue.trim() && (onRename(layer.id, editValue), setEditingId(null))}
                  className="layer-name-input"
                />
              ) : (
                <span
                  className="layer-name"
                  onDoubleClick={() => { setEditingId(layer.id); setEditValue(layer.name); }}
                >
                  {layer.name}
                </span>
              )}
              <button
                className="layer-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      <div className="layers-stats">
        <div>⚪ Круги: {layers.filter(l => l.type === 'circle').length}</div>
        <div>◻️ Квадраты: {layers.filter(l => l.type === 'square').length}</div>
        <div>📊 Всего: {layers.length}</div>
      </div>
    </div>
  );
};