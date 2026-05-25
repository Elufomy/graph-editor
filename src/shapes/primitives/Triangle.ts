import { Shape, Bounds, Point } from '../base/Shape';
import { RasterRenderer, RGBA, hexToRGBA } from '../../lib/raster/RasterRenderer';

export class Triangle extends Shape {
  points: Point[];

  constructor(points?: Point[], id?: string) {
    super(id);
    
    if (points && points.length === 3) {
      this.points = points;
    } else {
      // Треугольник по умолчанию: равнобедренный, центр в (0,0)
      this.points = [
        { x: 0, y: -40 },
        { x: -35, y: 30 },
        { x: 35, y: 30 }
      ];
    }
  }

  getLocalBounds(): Bounds {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  getBounds(): Bounds {
    const devicePoints = this.points.map(p => this.transformPointToDevice(p.x, p.y));
    
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
    const devicePoints = this.points.map(p => this.transformPointToDevice(p.x, p.y));
    
    const fillColor: RGBA = hexToRGBA(this.fillStyle, Math.round(this.fillOpacity * 255));
    const strokeColor: RGBA = hexToRGBA(this.strokeStyle, Math.round(this.strokeOpacity * 255));
    
    if (this.fillOpacity > 0) {
      r.fillPolygon(devicePoints, fillColor);
    }
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      r.strokePolygon(devicePoints, strokeColor, this.strokeWidth);
    }
  }

  // Проверка попадания в треугольник (метод барицентрических координат)
  hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    if (!local) return false;
    
    const [A, B, C] = this.points;
    
    const v0x = C.x - A.x;
    const v0y = C.y - A.y;
    const v1x = B.x - A.x;
    const v1y = B.y - A.y;
    const v2x = local.x - A.x;
    const v2y = local.y - A.y;
    
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scaleX = (maxX - minX) / (this.getLocalBounds().maxX - this.getLocalBounds().minX);
    const scaleY = (maxY - minY) / (this.getLocalBounds().maxY - this.getLocalBounds().minY);
    
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

  clone(): Triangle {
    const triangle = new Triangle(this.points.map(p => ({ ...p })), this.id);
    triangle.transform = { ...this.transform };
    triangle.fillStyle = this.fillStyle;
    triangle.fillOpacity = this.fillOpacity;
    triangle.strokeStyle = this.strokeStyle;
    triangle.strokeWidth = this.strokeWidth;
    triangle.strokeOpacity = this.strokeOpacity;
    return triangle;
  }

  toJSON(): any {
    return {
      type: 'Triangle',
      id: this.id,
      points: this.points.map(p => ({ ...p })),
      transform: { ...this.transform },
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity
    };
  }
}