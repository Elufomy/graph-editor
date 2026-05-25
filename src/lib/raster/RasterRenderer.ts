export type RGBA = { r: number; g: number; b: number; a: number };

export type LineAlg = 'bresenham' | 'wu';

// Ограничение значения от 0 до 255
export function clampByte(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}

// Преобразование HEX в RGBA
export function hexToRGBA(hex: string, alpha = 255): RGBA {
  let r = 0, g = 0, b = 0;
  
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  
  return { r, g, b, a: alpha };
}

export class RasterRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;
  private buf!: Uint8ClampedArray;
  
  width = 0;
  height = 0;
  dpr = 1;
  
  private canvas: HTMLCanvasElement;
  private _onWindowResize: () => void;
  private lineAlg: LineAlg = 'bresenham';
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('No 2D context');
    }
    
    this.ctx = ctx;
    this._onWindowResize = () => this.resize();
    window.addEventListener('resize', this._onWindowResize);
    
    this.resize();
  }
  
  dispose() {
    window.removeEventListener('resize', this._onWindowResize);
  }
  
  setLineAlgorithm(a: LineAlg) {
    this.lineAlg = a;
  }
  
  getLineAlgorithm(): LineAlg {
    return this.lineAlg;
  }
  
  // Управляющий метод рисования линий
  drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
    if (this.lineAlg === 'wu') {
      this.drawLineWu(x0, y0, x1, y1, color);
    } else {
      this.drawLineBrassenham(x0, y0, x1, y1, color);
    }
  }
  
  // ========== НИЗКОУРОВНЕВЫЕ МЕТОДЫ ==========
  
  // Вычисление 1D индекса в массиве buf по 2D координатам (x, y)
  private idx(x: number, y: number): number {
    const ix = Math.round(x);
    const iy = Math.round(y);
    return (iy * this.width + ix) * 4;
  }
  
  // Установка одного пикселя
  setPixel(x: number, y: number, color: RGBA) {
    const index = this.idx(x, y);
    if (index >= 0 && index + 3 < this.buf.length) {
      this.buf[index] = clampByte(color.r);
      this.buf[index + 1] = clampByte(color.g);
      this.buf[index + 2] = clampByte(color.b);
      this.buf[index + 3] = clampByte(color.a);
    }
  }
  
  // Альфа-блендинг
  private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1) {
    const index = this.idx(x, y);
    if (index < 0 || index + 3 >= this.buf.length) return;
    
    const srcA = clampByte(color.a * alphaFactor);
    if (srcA === 0) return;
    
    const srcR = color.r;
    const srcG = color.g;
    const srcB = color.b;
    
    const dstR = this.buf[index];
    const dstG = this.buf[index + 1];
    const dstB = this.buf[index + 2];
    const dstA = this.buf[index + 3];
    
    // Source Over blending
    const outA = srcA + dstA * (255 - srcA) / 255;
    
    if (outA === 0) return;
    
    const outR = (srcR * srcA + dstR * dstA * (255 - srcA) / 255) / outA;
    const outG = (srcG * srcA + dstG * dstA * (255 - srcA) / 255) / outA;
    const outB = (srcB * srcA + dstB * dstA * (255 - srcA) / 255) / outA;
    
    this.buf[index] = clampByte(outR);
    this.buf[index + 1] = clampByte(outG);
    this.buf[index + 2] = clampByte(outB);
    this.buf[index + 3] = clampByte(outA);
  }
  
  // ========== ЖИЗНЕННЫЙ ЦИКЛ ==========
  
  resize() {
    const cssWidth = this.canvas.clientWidth;
    const cssHeight = this.canvas.clientHeight;
    this.dpr = window.devicePixelRatio || 1;
    
    this.width = Math.max(1, Math.floor(cssWidth * this.dpr));
    this.height = Math.max(1, Math.floor(cssHeight * this.dpr));
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.buf = this.imageData.data;
  }
  
  beginFrame(clear = true) {
    if (clear && this.buf) {
      for (let i = 0; i < this.buf.length; i++) {
        this.buf[i] = 0;
      }
    }
  }
  
  commit() {
    if (this.imageData) {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
  }
  
  // ========== АЛГОРИТМЫ ЛИНИЙ ==========
  
  // Алгоритм Брезенхема
  drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const xEnd = Math.round(x1);
    const yEnd = Math.round(y1);
    
    let dx = Math.abs(xEnd - x);
    let dy = Math.abs(yEnd - y);
    const sx = x < xEnd ? 1 : -1;
    const sy = y < yEnd ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      this.setPixel(x, y, color);
      
      if (x === xEnd && y === yEnd) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
  
  // Алгоритм Сяолиня Ву (сглаженная линия)
  drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
    let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    
    if (steep) {
      [x0, y0] = [y0, x0];
      [x1, y1] = [y1, x1];
    }
    
    if (x0 > x1) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }
    
    let dx = x1 - x0;
    let dy = y1 - y0;
    let gradient = dx === 0 ? 1 : dy / dx;
    
    let y = y0;
    
    for (let x = x0; x <= x1; x++) {
      const intery = y;
      const fpart = intery - Math.floor(intery);
      const rfpart = 1 - fpart;
      
      if (steep) {
        this.blendPixel(Math.floor(intery), x, color, rfpart);
        this.blendPixel(Math.floor(intery) + 1, x, color, fpart);
      } else {
        this.blendPixel(x, Math.floor(intery), color, rfpart);
        this.blendPixel(x, Math.floor(intery) + 1, color, fpart);
      }
      
      y += gradient;
    }
  }
  
  // ========== ЗАЛИВКА ==========
  
  // Отрисовка горизонтальной линии
  private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
    let start = Math.min(x0, x1);
    let end = Math.max(x0, x1);
    for (let x = start; x <= end; x++) {
      this.setPixel(x, y, color);
    }
  }
  
  // Заливка окружности
  fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
    const r = Math.abs(radius);
    const startY = Math.max(0, Math.round(cy - r));
    const endY = Math.min(this.height - 1, Math.round(cy + r));
    
    for (let y = startY; y <= endY; y++) {
      const dy = y - cy;
      const dx = Math.sqrt(r * r - dy * dy);
      const xStart = Math.max(0, Math.round(cx - dx));
      const xEnd = Math.min(this.width - 1, Math.round(cx + dx));
      this.drawHSpan(y, xStart, xEnd, color);
    }
  }
  
  // Заливка многоугольника (алгоритм сканирующей строки)
  fillPolygon(points: { x: number; y: number }[], color: RGBA) {
    if (points.length < 3) return;
    
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (const p of points) {
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(this.height - 1, Math.ceil(maxY));
    
    for (let y = minY; y <= maxY; y++) {
      const intersections: number[] = [];
      const scanY = y + 0.5;
      
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        if ((p1.y <= scanY && p2.y > scanY) || (p2.y <= scanY && p1.y > scanY)) {
          const t = (scanY - p1.y) / (p2.y - p1.y);
          const x = p1.x + t * (p2.x - p1.x);
          intersections.push(x);
        }
      }
      
      intersections.sort((a, b) => a - b);
      
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const xStart = Math.max(0, Math.round(intersections[i]));
          const xEnd = Math.min(this.width - 1, Math.round(intersections[i + 1]));
          this.drawHSpan(y, xStart, xEnd, color);
        }
      }
    }
  }
  
  // ========== КОНТУРЫ ==========
  
  // Отрисовка толстого отрезка
  strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1) {
    if (width <= 1) {
      this.drawLine(x0, y0, x1, y1, color);
      return;
    }
    
    const half = width / 2;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) {
      this.fillCircle(x0, y0, half, color);
      return;
    }
    
    const nx = -dy / len * half;
    const ny = dx / len * half;
    
    const rect: { x: number; y: number }[] = [
      { x: x0 - nx, y: y0 - ny },
      { x: x0 + nx, y: y0 + ny },
      { x: x1 + nx, y: y1 + ny },
      { x: x1 - nx, y: y1 - ny }
    ];
    
    this.fillPolygon(rect, color);
    this.fillCircle(x0, y0, half, color);
    this.fillCircle(x1, y1, half, color);
  }
  
  // Отрисовка контура многоугольника
  strokePolygon(points: { x: number; y: number }[], color: RGBA, width = 1) {
    if (points.length < 2) return;
    
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      this.strokeLine(p1.x, p1.y, p2.x, p2.y, color, width);
    }
  }
}