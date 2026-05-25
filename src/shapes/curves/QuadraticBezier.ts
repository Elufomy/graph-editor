import { Shape, Bounds, Point } from '../base/Shape';
import { RasterRenderer, RGBA, hexToRGBA } from '../../lib/raster/RasterRenderer';

export class QuadraticBezier extends Shape {
  p0: Point;
  p1: Point;
  p2: Point;
  
  private approximationPoints: Point[] = [];

  constructor(p0?: Point, p1?: Point, p2?: Point, id?: string) {
    super(id);
    
    this.p0 = p0 || { x: -50, y: 0 };
    this.p1 = p1 || { x: 0, y: 50 };
    this.p2 = p2 || { x: 50, y: 0 };
  }

  // Вычисление точки на кривой по параметру t (0..1)
  evalLocal(t: number): Point {
    const t1 = 1 - t;
    const x = t1 * t1 * this.p0.x + 2 * t1 * t * this.p1.x + t * t * this.p2.x;
    const y = t1 * t1 * this.p0.y + 2 * t1 * t * this.p1.y + t * t * this.p2.y;
    return { x, y };
  }

  // Аппроксимация кривой ломаной (количество сегментов)
  getApproximationPoints(segments: number = 30): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= segments; i++) {
      points.push(this.evalLocal(i / segments));
    }
    return points;
  }

  // Получение точек в экранных координатах
  getDeviceApproximationPoints(segments: number = 30): Point[] {
    return this.getApproximationPoints(segments).map(p => this.transformPointToDevice(p.x, p.y));
  }

  getLocalBounds(): Bounds {
    const points = this.getApproximationPoints(30);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  getBounds(): Bounds {
    const points = this.getDeviceApproximationPoints(30);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  drawRaster(r: RasterRenderer): void {
    const points = this.getDeviceApproximationPoints(50);
    const color: RGBA = hexToRGBA(this.strokeStyle, Math.round(this.strokeOpacity * 255));
    
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      for (let i = 0; i < points.length - 1; i++) {
        r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color, this.strokeWidth);
      }
    }
  }

  hitTest(px: number, py: number): boolean {
    const points = this.getDeviceApproximationPoints(50);
    const tolerance = this.strokeWidth / 2 + 5;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      const ax = p2.x - p1.x;
      const ay = p2.y - p1.y;
      const len2 = ax * ax + ay * ay;
      
      if (len2 === 0) continue;
      
      let t = ((px - p1.x) * ax + (py - p1.y) * ay) / len2;
      t = Math.max(0, Math.min(1, t));
      
      const projX = p1.x + t * ax;
      const projY = p1.y + t * ay;
      
      const dx = px - projX;
      const dy = py - projY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < tolerance) return true;
    }
    return false;
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const oldCenter = this.getCenter();
    
    this.transform.x = centerX;
    this.transform.y = centerY;
  }

  getControlPoints(): Point[] {
    return [
      this.transformPointToDevice(this.p0.x, this.p0.y),
      this.transformPointToDevice(this.p1.x, this.p1.y),
      this.transformPointToDevice(this.p2.x, this.p2.y)
    ];
  }

  setControlPoint(index: number, devicePoint: Point): void {
    const local = this.transformPointToLocal(devicePoint.x, devicePoint.y);
    if (!local) return;
    
    switch(index) {
      case 0: this.p0 = local; break;
      case 1: this.p1 = local; break;
      case 2: this.p2 = local; break;
    }
  }

  clone(): QuadraticBezier {
    const bezier = new QuadraticBezier(
      { ...this.p0 }, { ...this.p1 }, { ...this.p2 }, this.id
    );
    bezier.transform = { ...this.transform };
    bezier.fillStyle = this.fillStyle;
    bezier.fillOpacity = this.fillOpacity;
    bezier.strokeStyle = this.strokeStyle;
    bezier.strokeWidth = this.strokeWidth;
    bezier.strokeOpacity = this.strokeOpacity;
    return bezier;
  }

  toJSON(): any {
    return {
      type: 'QuadraticBezier',
      id: this.id,
      p0: { ...this.p0 },
      p1: { ...this.p1 },
      p2: { ...this.p2 },
      transform: { ...this.transform },
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity
    };
  }
}