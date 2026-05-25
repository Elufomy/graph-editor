import React from 'react';
import { ToolType } from '../types/shared';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  currentOpacity: number;
  onOpacityChange: (opacity: number) => void;
  currentThickness: number;
  onThicknessChange: (thickness: number) => void;
  isFilled: boolean;
  onFilledChange: (filled: boolean) => void;
  showFill?: boolean;
}

const tools: { type: ToolType; icon: string; label: string }[] = [
  { type: 'select', icon: '🖱️', label: 'Выбор' },
  { type: 'circle', icon: '⚪', label: 'Круг' },
  { type: 'square', icon: '◻️', label: 'Квадрат' },
  { type: 'polygon', icon: '🔺', label: 'Многоугольник' },
  { type: 'line', icon: '─', label: 'Линия' },
  { type: 'freehand', icon: '✎', label: 'Кисть' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  currentOpacity,
  onOpacityChange,
  currentThickness,
  onThicknessChange,
  isFilled,
  onFilledChange,
  showFill = true,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const currentToolInfo = tools.find(t => t.type === currentTool) || tools[0];

  return (
    <div className="bottom-toolbar">
      <button
        className={`tool-cursor ${currentTool === 'select' ? 'active' : ''}`}
        onClick={() => onToolChange('select')}
      >
        🖱️
      </button>

      <div className="tool-selector-wrapper">
        <button className="tool-current" onClick={() => setShowMenu(!showMenu)}>
          <span>{currentToolInfo.icon}</span>
          <span>{currentToolInfo.label}</span>
          <span>▼</span>
        </button>
        {showMenu && (
          <div className="tool-menu">
            {tools.filter(t => t.type !== 'select').map(tool => (
              <button key={tool.type} onClick={() => { onToolChange(tool.type); setShowMenu(false); }}>
                {tool.icon} {tool.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tool-settings">
        <div className="setting">
          <label>Цвет</label>
          <input type="color" value={currentColor} onChange={(e) => onColorChange(e.target.value)} />
        </div>
        <div className="setting">
          <label>Прозрачность</label>
          <input type="range" min="0" max="1" step="0.01" value={currentOpacity} onChange={(e) => onOpacityChange(parseFloat(e.target.value))} />
          <span>{Math.round(currentOpacity * 100)}%</span>
        </div>
        <div className="setting">
          <label>Толщина</label>
          <input type="range" min="1" max="20" value={currentThickness} onChange={(e) => onThicknessChange(parseInt(e.target.value))} />
          <span>{currentThickness}px</span>
        </div>
        {showFill && currentTool !== 'line' && currentTool !== 'freehand' && (
          <div className="setting">
            <label>Заливка</label>
            <button className={`fill-btn ${isFilled ? 'active' : ''}`} onClick={() => onFilledChange(!isFilled)}>
              {isFilled ? 'Включена' : 'Выключена'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};