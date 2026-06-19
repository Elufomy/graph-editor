import { Shape, Bounds, Point } from '../base/Shape';
import { RasterRenderer, RGBA, hexToRGBA } from '../../lib/raster/RasterRenderer';

export class Rect extends Shape {
  width: number;
  height: number;

  constructor(width: number = 80, height: number = 80, id?: string) {
    super(id);
    this.width = width;
    this.height = height;
  }

  getLocalCorners(): Point[] {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    return [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH }
    ];
  }

  getLocalBounds(): Bounds {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    return { minX: -halfW, minY: -halfH, maxX: halfW, maxY: halfH };
  }

  getBounds(): Bounds {
    const corners = this.getLocalCorners();
    const deviceCorners = corners.map(p => this.transformPointToDevice(p.x, p.y));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of deviceCorners) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  drawRaster(r: RasterRenderer): void {
    const corners = this.getLocalCorners();
    const deviceCorners = corners.map(p => this.transformPointToDevice(p.x, p.y));
    const fillColor: RGBA = hexToRGBA(this.fillStyle, Math.round(this.fillOpacity * 255));
    const strokeColor: RGBA = hexToRGBA(this.strokeStyle, Math.round(this.strokeOpacity * 255));
    
    if (this.fillOpacity > 0) {
      r.fillPolygon(deviceCorners, fillColor);
    }
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      r.strokePolygon(deviceCorners, strokeColor, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    if (!local) return false;
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    return local.x >= -halfW && local.x <= halfW && local.y >= -halfH && local.y <= halfH;
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.transform.x = centerX;
    this.transform.y = centerY;
    this.width = Math.max(20, maxX - minX);
    this.height = Math.max(20, maxY - minY);
  }

  clone(): Rect {
    const rect = new Rect(this.width, this.height, this.id);
    rect.transform = { ...this.transform };
    rect.fillStyle = this.fillStyle;
    rect.fillOpacity = this.fillOpacity;
    rect.strokeStyle = this.strokeStyle;
    rect.strokeWidth = this.strokeWidth;
    rect.strokeOpacity = this.strokeOpacity;
    return rect;
  }

  toJSON(): any {
    return {
      type: 'Rect',
      id: this.id,
      width: this.width,
      height: this.height,
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