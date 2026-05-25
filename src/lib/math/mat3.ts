// src/lib/math/mat3.ts

export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

export interface Point2D {
  x: number;
  y: number;
}

export const EPS = 1e-10;

export const mat3 = {
  // Единичная матрица (не меняет объект)
  identity(): Mat3 {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  },

  // Умножение двух матриц 3x3
  multiply(a: Mat3, b: Mat3): Mat3 {
    const result: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += a[row * 3 + k] * b[k * 3 + col];
        }
        result[row * 3 + col] = sum;
      }
    }
    
    return result;
  },

  // Матрица перемещения
  translate(tx: number, ty: number): Mat3 {
    return [
      1, 0, tx,
      0, 1, ty,
      0, 0, 1
    ];
  },

  // Матрица масштабирования
  scale(sx: number, sy: number): Mat3 {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1
    ];
  },

  // Матрица поворота (угол в радианах)
  rotate(rad: number): Mat3 {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1
    ];
  },

  // Комбинированная матрица: Translate * Rotate * Scale
  fromTransform(
    tx: number,
    ty: number,
    rotationRad: number,
    sx: number,
    sy: number
  ): Mat3 {
    const t = mat3.translate(tx, ty);
    const r = mat3.rotate(rotationRad);
    const s = mat3.scale(sx, sy);
    
    // M = T * (R * S)
    const rs = mat3.multiply(r, s);
    return mat3.multiply(t, rs);
  },

  // Применение матрицы к точке
  transformPoint(m: Mat3, x: number, y: number): Point2D {
    const x1 = m[0] * x + m[1] * y + m[2];
    const y1 = m[3] * x + m[4] * y + m[5];
    return { x: x1, y: y1 };
  },

  // Обратная матрица (для hit testing)
  invert(m: Mat3): Mat3 | null {
    const a = m[0], b = m[1], tx = m[2];
    const c = m[3], d = m[4], ty = m[5];
    
    const det = a * d - b * c;
    
    if (Math.abs(det) < EPS) {
      return null;
    }
    
    const invDet = 1 / det;
    
    return [
      d * invDet,
      -b * invDet,
      (b * ty - d * tx) * invDet,
      -c * invDet,
      a * invDet,
      (c * tx - a * ty) * invDet,
      0, 0, 1
    ];
  }
};