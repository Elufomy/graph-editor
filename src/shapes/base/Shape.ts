import { mat3, Mat3 } from '../../lib/math/mat3';
import { RasterRenderer, RGBA } from '../../lib/raster/RasterRenderer';

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Point {
  x: number;
  y: number;
}

export abstract class Shape {
  id: string;
  transform: Transform;
  fillStyle: string;
  fillOpacity: number;
  strokeStyle: string;
  strokeWidth: number;
  strokeOpacity: number;

  constructor(id?: string) {
    this.id = id || Date.now().toString();
    this.transform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    this.fillStyle = '#4a5568';
    this.fillOpacity = 0.9;
    this.strokeStyle = '#4a5568';
    this.strokeWidth = 2;
    this.strokeOpacity = 1;
  }

  getLocalToDeviceMatrix(): Mat3 {
    return mat3.fromTransform(
      this.transform.x,
      this.transform.y,
      this.transform.rotation,
      this.transform.scaleX,
      this.transform.scaleY
    );
  }

  getDeviceToLocalMatrix(): Mat3 | null {
    return mat3.invert(this.getLocalToDeviceMatrix());
  }

  transformPointToDevice(localX: number, localY: number): Point {
    const m = this.getLocalToDeviceMatrix();
    const result = mat3.transformPoint(m, localX, localY);
    return { x: result.x, y: result.y };
  }

  transformPointToLocal(deviceX: number, deviceY: number): Point | null {
    const inv = this.getDeviceToLocalMatrix();
    if (!inv) return null;
    const result = mat3.transformPoint(inv, deviceX, deviceY);
    return { x: result.x, y: result.y };
  }

  getCenter(): Point {
    const localBounds = this.getLocalBounds();
    const centerX = (localBounds.minX + localBounds.maxX) / 2;
    const centerY = (localBounds.minY + localBounds.maxY) / 2;
    return this.transformPointToDevice(centerX, centerY);
  }

  setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
  }

  abstract resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void;
  abstract drawRaster(r: RasterRenderer): void;
  abstract hitTest(px: number, py: number): boolean;
  abstract getBounds(): Bounds;
  abstract getLocalBounds(): Bounds;
  abstract clone(): Shape;
  abstract toJSON(): any;
}