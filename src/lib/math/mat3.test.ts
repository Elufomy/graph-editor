import { test, expect } from 'vitest';
import { mat3, type Mat3 } from './mat3';

function expectMatCloseTo(actual: Mat3, expected: Mat3, eps = 1e-9) {
  for (let i = 0; i < 9; i++) {
    expect(actual[i]).toBeCloseTo(expected[i], 6);
  }
}

test("identity: full matrix", () => {
  const I = mat3.identity();
  const expected: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  expectMatCloseTo(I, expected);
});

test("translate: exact matrix and transformPoint", () => {
  const tx = 10, ty = -5;
  const T = mat3.translate(tx, ty);
  const expected: Mat3 = [1, 0, tx, 0, 1, ty, 0, 0, 1];
  expectMatCloseTo(T, expected);

  const p = mat3.transformPoint(T, 3, 4);
  expect(p.x).toBeCloseTo(3 + tx);
  expect(p.y).toBeCloseTo(4 + ty);
});

test("scale: exact matrix and point behavior", () => {
  const sx = 2, sy = 0.5;
  const S = mat3.scale(sx, sy);
  const expected: Mat3 = [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  expectMatCloseTo(S, expected);

  const p = mat3.transformPoint(S, 4, 6);
  expect(p.x).toBeCloseTo(4 * sx);
  expect(p.y).toBeCloseTo(6 * sy);
});

test("rotate: identity at 0", () => {
  const R = mat3.rotate(0);
  expect(R[0]).toBeCloseTo(1);
  expect(R[4]).toBeCloseTo(1);
  expect(R[2]).toBeCloseTo(0);
  expect(R[5]).toBeCloseTo(0);
});

test("rotate: 90 degrees", () => {
  const R = mat3.rotate(Math.PI / 2);
  const p = mat3.transformPoint(R, 1, 0);
  expect(p.x).toBeCloseTo(0);
  expect(p.y).toBeCloseTo(1);
});

test("multiply: identity", () => {
  const T = mat3.translate(10, 5);
  const I = mat3.identity();
  const result = mat3.multiply(T, I);
  expect(result[2]).toBeCloseTo(10);
  expect(result[5]).toBeCloseTo(5);
});

test("invert: translate", () => {
  const T = mat3.translate(10, 20);
  const inv = mat3.invert(T);
  expect(inv).not.toBeNull();
  if (inv) {
    const I = mat3.multiply(T, inv);
    expect(I[0]).toBeCloseTo(1);
    expect(I[4]).toBeCloseTo(1);
    expect(I[8]).toBeCloseTo(1);
    expect(I[2]).toBeCloseTo(0);
    expect(I[5]).toBeCloseTo(0);
  }
});

test("invert: degenerate scale returns null", () => {
  expect(mat3.invert(mat3.scale(0, 1))).toBeNull();
  expect(mat3.invert(mat3.scale(1, 0))).toBeNull();
});

test("fromTransform: composition matches manual steps", () => {
  const tx = 100, ty = 50;
  const angle = Math.PI / 4;
  const sx = 2, sy = 1.5;
  
  const M = mat3.fromTransform(tx, ty, angle, sx, sy);
  const p = mat3.transformPoint(M, 1, 0);
  
  const scaledX = 1 * sx;
  const scaledY = 0 * sy;
  const rotatedX = scaledX * Math.cos(angle) - scaledY * Math.sin(angle);
  const rotatedY = scaledX * Math.sin(angle) + scaledY * Math.cos(angle);
  const manualX = rotatedX + tx;
  const manualY = rotatedY + ty;
  
  expect(p.x).toBeCloseTo(manualX);
  expect(p.y).toBeCloseTo(manualY);
});

test("transformPoint: basic example", () => {
  const M: Mat3 = [2, 0, 5, 0, 3, 7, 0, 0, 1];
  const p = mat3.transformPoint(M, 1, 1);
  expect(p.x).toBeCloseTo(7);
  expect(p.y).toBeCloseTo(10);
});