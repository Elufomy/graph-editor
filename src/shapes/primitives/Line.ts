import { Shape, Bounds, Point } from '../base/Shape';
import { RasterRenderer, RGBA, hexToRGBA } from '../../lib/raster/RasterRenderer';

export class Line extends Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(x1: number = -50, y1: number = 0, x2: number = 50, y2: number = 0, id?: string) {
    super(id);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  getLocalBounds(): Bounds {
    return {
      minX: Math.min(this.x1, this.x2),
      minY: Math.min(this.y1, this.y2),
      maxX: Math.max(this.x1, this.x2),
      maxY: Math.max(this.y1, this.y2)
    };
  }

  getBounds(): Bounds {
    const p1 = this.transformPointToDevice(this.x1, this.y1);
    const p2 = this.transformPointToDevice(this.x2, this.y2);
    
    return {
      minX: Math.min(p1.x, p2.x),
      minY: Math.min(p1.y, p2.y),
      maxX: Math.max(p1.x, p2.x),
      maxY: Math.max(p1.y, p2.y)
    };
  }

  drawRaster(r: RasterRenderer): void {
    const p1 = this.transformPointToDevice(this.x1, this.y1);
    const p2 = this.transformPointToDevice(this.x2, this.y2);
    
    const color: RGBA = hexToRGBA(this.strokeStyle, Math.round(this.strokeOpacity * 255));
    
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      r.strokeLine(p1.x, p1.y, p2.x, p2.y, color, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    if (!local) return false;
    
    const ax = this.x2 - this.x1;
    const ay = this.y2 - this.y1;
    const len2 = ax * ax + ay * ay;
    
    if (len2 === 0) {
      const dx = local.x - this.x1;
      const dy = local.y - this.y1;
      return Math.sqrt(dx * dx + dy * dy) < this.strokeWidth / 2;
    }
    
    let t = ((local.x - this.x1) * ax + (local.y - this.y1) * ay) / len2;
    t = Math.max(0, Math.min(1, t));
    
    const projX = this.x1 + t * ax;
    const projY = this.y1 + t * ay;
    
    const dx = local.x - projX;
    const dy = local.y - projY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist < this.strokeWidth / 2 + 2;
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    this.transform.x = centerX;
    this.transform.y = centerY;
  }

  clone(): Line {
    const line = new Line(this.x1, this.y1, this.x2, this.y2, this.id);
    line.transform = { ...this.transform };
    line.fillStyle = this.fillStyle;
    line.fillOpacity = this.fillOpacity;
    line.strokeStyle = this.strokeStyle;
    line.strokeWidth = this.strokeWidth;
    line.strokeOpacity = this.strokeOpacity;
    return line;
  }

  toJSON(): any {
    return {
      type: 'Line',
      id: this.id,
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      transform: { ...this.transform },
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity
    };
  }
}