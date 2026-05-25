import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CanvasScene from '../components/CanvasScene';

const RasterTest: React.FC = () => {
  const navigate = useNavigate();
  const [lineAlg, setLineAlg] = useState<'bresenham' | 'wu'>('bresenham');
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px',
        background: '#1e293b',
        color: 'white',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        borderBottom: '1px solid #334155'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#3b82f6',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>
        
        <h2 style={{ margin: 0 }}>Растеризатор - Лабораторная №4</h2>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setLineAlg('bresenham')}
            style={{
              background: lineAlg === 'bresenham' ? '#3b82f6' : '#334155',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Брезенхем
          </button>
          <button
            onClick={() => setLineAlg('wu')}
            style={{
              background: lineAlg === 'wu' ? '#3b82f6' : '#334155',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ву (сглаженная)
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <CanvasScene lineAlg={lineAlg} />
      </div>
      
      <div style={{
        padding: '12px',
        background: '#0f172a',
        color: '#94a3b8',
        fontSize: '12px',
        borderTop: '1px solid #334155',
        textAlign: 'center'
      }}>
        🔵 Синий треугольник (заливка) | 🔴 Красный круг | 🟢 Зеленый контур | 
        Алгоритм линии: {lineAlg === 'bresenham' ? 'Брезенхем (ступенчатый)' : 'Ву (сглаженный)'}
      </div>
    </div>
  );
};

export default RasterTest;