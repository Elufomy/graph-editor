import { Shape, Bounds, Point } from '../base/Shape';
import { RasterRenderer, RGBA, hexToRGBA } from '../../lib/raster/RasterRenderer';

export class Oval extends Shape {
  rx: number;
  ry: number;

  constructor(rx: number = 40, ry: number = 35, id?: string) {
    super(id);
    this.rx = rx;
    this.ry = ry;
  }

  getLocalPoints(segments: number = 36): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push({ x: Math.cos(angle) * this.rx, y: Math.sin(angle) * this.ry });
    }
    return points;
  }

  getLocalBounds(): Bounds {
    return { minX: -this.rx, minY: -this.ry, maxX: this.rx, maxY: this.ry };
  }

  getBounds(): Bounds {
    const points = this.getLocalPoints(36);
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
    const points = this.getLocalPoints(36);
    const devicePoints = points.map(p => this.transformPointToDevice(p.x, p.y));
    const fillColor: RGBA = hexToRGBA(this.fillStyle, Math.round(this.fillOpacity * 255));
    const strokeColor: RGBA = hexToRGBA(this.strokeStyle, Math.round(this.strokeOpacity * 255));
    
    if (this.fillOpacity > 0) {
      r.fillPolygon(devicePoints, fillColor);
    }
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      r.strokePolygon(devicePoints, strokeColor, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    if (!local) return false;
    const nx = local.x / this.rx;
    const ny = local.y / this.ry;
    return nx * nx + ny * ny <= 1;
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.transform.x = centerX;
    this.transform.y = centerY;
    this.rx = Math.max(10, (maxX - minX) / 2);
    this.ry = Math.max(10, (maxY - minY) / 2);
  }

  clone(): Oval {
    const oval = new Oval(this.rx, this.ry, this.id);
    oval.transform = { ...this.transform };
    oval.fillStyle = this.fillStyle;
    oval.fillOpacity = this.fillOpacity;
    oval.strokeStyle = this.strokeStyle;
    oval.strokeWidth = this.strokeWidth;
    oval.strokeOpacity = this.strokeOpacity;
    return oval;
  }

  toJSON(): any {
    return {
      type: 'Oval',
      id: this.id,
      rx: this.rx,
      ry: this.ry,
      matrix: this.matrix,
      transform: { ...this.transform },
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity
    };
  }
}