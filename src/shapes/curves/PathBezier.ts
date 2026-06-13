import { Shape, Bounds, Point } from '../base/Shape';
import { RasterRenderer, RGBA, hexToRGBA } from '../../lib/raster/RasterRenderer';

export type PathMode = 'polyline' | 'bezier' | 'catmull';

export class PathBezier extends Shape {
  points: Point[];
  mode: PathMode;
  closed: boolean;
  tension: number;

  constructor(points?: Point[], mode: PathMode = 'polyline', closed: boolean = false, id?: string) {
    super(id);
    this.points = points || [
      { x: -80, y: 0 },
      { x: -40, y: -40 },
      { x: 0, y: 0 },
      { x: 40, y: 40 },
      { x: 80, y: 0 }
    ];
    this.mode = mode;
    this.closed = closed;
    this.tension = 0.5;
  }

  getApproximationPoints(segments: number = 30): Point[] {
    if (this.mode === 'polyline') {
      return this.points;
    }
    
    const points: Point[] = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const p0 = this.points[i];
        const p1 = this.points[i + 1];
        points.push({
          x: p0.x * (1 - t) + p1.x * t,
          y: p0.y * (1 - t) + p1.y * t
        });
      }
    }
    
    if (this.closed && this.points.length > 0) {
      points.push(points[0]);
    }
    
    return points;
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
    const points = this.getApproximationPoints(30);
    const devicePoints = points.map(p => this.transformPointToDevice(p.x, p.y));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of devicePoints) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  drawRaster(r: RasterRenderer): void {
    const points = this.getApproximationPoints(40);
    const devicePoints = points.map(p => this.transformPointToDevice(p.x, p.y));
    const color: RGBA = hexToRGBA(this.strokeStyle, Math.round(this.strokeOpacity * 255));
    
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      for (let i = 0; i < devicePoints.length - 1; i++) {
        r.strokeLine(devicePoints[i].x, devicePoints[i].y, devicePoints[i + 1].x, devicePoints[i + 1].y, color, this.strokeWidth);
      }
    }
  }

  hitTest(px: number, py: number): boolean {
    const points = this.getApproximationPoints(40);
    const devicePoints = points.map(p => this.transformPointToDevice(p.x, p.y));
    const tolerance = this.strokeWidth / 2 + 5;
    
    for (let i = 0; i < devicePoints.length - 1; i++) {
      const p1 = devicePoints[i];
      const p2 = devicePoints[i + 1];
      
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
    const oldBounds = this.getBounds();
    const scaleX = (maxX - minX) / (oldBounds.maxX - oldBounds.minX);
    const scaleY = (maxY - minY) / (oldBounds.maxY - oldBounds.minY);
    
    this.transform.x = centerX;
    this.transform.y = centerY;
    this.transform.scaleX = scaleX;
    this.transform.scaleY = scaleY;
  }

  getControlPoints(): Point[] {
    return this.points.map(p => this.transformPointToDevice(p.x, p.y));
  }

  setControlPoint(index: number, devicePoint: Point): void {
    const local = this.transformPointToLocal(devicePoint.x, devicePoint.y);
    if (local && index >= 0 && index < this.points.length) {
      this.points[index] = local;
    }
  }

  clone(): PathBezier {
    const path = new PathBezier(
      this.points.map(p => ({ ...p })),
      this.mode,
      this.closed,
      this.id
    );
    path.transform = { ...this.transform };
    path.fillStyle = this.fillStyle;
    path.fillOpacity = this.fillOpacity;
    path.strokeStyle = this.strokeStyle;
    path.strokeWidth = this.strokeWidth;
    path.strokeOpacity = this.strokeOpacity;
    path.tension = this.tension;
    return path;
  }

  toJSON(): any {
    return {
      type: 'PathBezier',
      id: this.id,
      points: this.points.map(p => ({ ...p })),
      mode: this.mode,
      closed: this.closed,
      tension: this.tension,
      transform: { ...this.transform },
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity
    };
  }
}