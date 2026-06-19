import { save as saveDialog, open as openDialog } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { Shape } from '../shapes/base/Shape';
import { Rect, Oval, Line, Triangle, QuadraticBezier, CubicBezier, PathBezier } from '../shapes';

export interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lineAlgorithm: 'bresenham' | 'wu';
  shapes: any[];
}

export interface ProjectIndex {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function saveProjectDialog(project: ProjectData): Promise<boolean> {
  try {
    const filePath = await saveDialog({
      title: 'Сохранить проект',
      defaultPath: `${project.name}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    
    if (!filePath) return false;
    
    const dataToSave = {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lineAlgorithm: project.lineAlgorithm,
      shapes: project.shapes.map(shape => {
        if (shape && typeof shape === 'object' && 'toJSON' in shape) {
          return shape.toJSON();
        }
        return shape;
      })
    };
    
    await writeTextFile(filePath, JSON.stringify(dataToSave, null, 2));
    console.log('✅ Проект сохранён в:', filePath);
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения:', error);
    return false;
  }
}

export async function loadProjectDialog(): Promise<ProjectData | null> {
  try {
    const filePath = await openDialog({
      title: 'Открыть проект',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      multiple: false
    });
    
    if (!filePath) return null;
    
    const content = await readTextFile(filePath);
    const data = JSON.parse(content);
    console.log('📂 Проект загружен из:', filePath);
    return data;
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    return null;
  }
}

export async function loadProjectIndex(): Promise<ProjectIndex[]> {
  return [];
}

export function shapeFromJSON(data: any): Shape | null {
  console.log('🔍 shapeFromJSON получил:', data);
  console.log('📌 Тип фигуры:', data?.type);
  
  const { type, id, transform, fillStyle, fillOpacity, strokeStyle, strokeWidth, strokeOpacity, matrix } = data;
  
  let shape: Shape | null = null;
  
  try {
    // Принудительно определяем тип по наличию полей
    let detectedType = type;
    
    // Если тип не указан или неизвестен, определяем по полям
    if (!detectedType || detectedType === 'circle') {
      if (data.rx !== undefined || data.ry !== undefined) {
        detectedType = 'Oval';
      } else if (data.width !== undefined && data.height !== undefined) {
        detectedType = 'Rect';
      } else if (data.x1 !== undefined || data.x2 !== undefined) {
        detectedType = 'Line';
      }
    }
    
    console.log('🔍 Определённый тип:', detectedType);
    
    switch (detectedType) {
      case 'Rect':
      case 'square':
        shape = new Rect(data.width || 80, data.height || 80, id);
        break;
        
      case 'Oval':
      case 'circle':
        const rx = data.rx || data.width / 2 || 35;
        const ry = data.ry || data.height / 2 || 35;
        shape = new Oval(rx, ry, id);
        break;
        
      case 'Line':
      case 'line':
        shape = new Line(
          data.x1 !== undefined ? data.x1 : -50,
          data.y1 !== undefined ? data.y1 : 0,
          data.x2 !== undefined ? data.x2 : 50,
          data.y2 !== undefined ? data.y2 : 0,
          id
        );
        break;
        
      case 'Triangle':
        shape = new Triangle(data.points?.map((p: any) => ({ x: p.x, y: p.y })), id);
        break;
        
      case 'QuadraticBezier':
        shape = new QuadraticBezier(
          { x: data.p0?.x || 0, y: data.p0?.y || 0 },
          { x: data.p1?.x || 0, y: data.p1?.y || 0 },
          { x: data.p2?.x || 0, y: data.p2?.y || 0 },
          id
        );
        break;
        
      case 'CubicBezier':
        shape = new CubicBezier(
          { x: data.p0?.x || 0, y: data.p0?.y || 0 },
          { x: data.p1?.x || 0, y: data.p1?.y || 0 },
          { x: data.p2?.x || 0, y: data.p2?.y || 0 },
          { x: data.p3?.x || 0, y: data.p3?.y || 0 },
          id
        );
        break;
        
      case 'PathBezier':
        shape = new PathBezier(data.points?.map((p: any) => ({ x: p.x, y: p.y })), data.mode, data.closed, id);
        if (data.tension !== undefined && shape instanceof PathBezier) {
          shape.tension = data.tension;
        }
        break;
        
      default:
        console.warn(`⚠️ Неизвестный тип фигуры: ${detectedType}`);
        return null;
    }
    
    if (shape) {
      if (matrix && Array.isArray(matrix) && matrix.length === 9) {
        (shape as any).matrix = matrix;
        console.log('✅ Матрица восстановлена');
      } else if (transform) {
        shape.transform = {
          x: transform.x || 0,
          y: transform.y || 0,
          rotation: transform.rotation || 0,
          scaleX: transform.scaleX || 1,
          scaleY: transform.scaleY || 1
        };
        console.log('✅ Использован transform');
      }
      
      shape.fillStyle = fillStyle || '#4a5568';
      shape.fillOpacity = fillOpacity !== undefined ? fillOpacity : 0.9;
      shape.strokeStyle = strokeStyle || '#4a5568';
      shape.strokeWidth = strokeWidth !== undefined ? strokeWidth : 2;
      shape.strokeOpacity = strokeOpacity !== undefined ? strokeOpacity : 1;
      
      console.log('✅ Фигура восстановлена:', shape.constructor.name);
      console.log('✅ Цвет заливки:', shape.fillStyle);
    }
  } catch (error) {
    console.error('❌ Ошибка восстановления фигуры:', error);
    return null;
  }
  
  return shape;
}