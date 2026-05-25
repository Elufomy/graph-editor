import { describe, test, expect } from 'vitest';
import { Rect, Oval, Line, Triangle, QuadraticBezier, CubicBezier } from './index';

describe('Rect', () => {
  test('hitTest - точка внутри', () => {
    const rect = new Rect(100, 100);
    rect.transform.x = 0;
    rect.transform.y = 0;
    expect(rect.hitTest(0, 0)).toBe(true);
  });

  test('hitTest - точка вне', () => {
    const rect = new Rect(100, 100);
    rect.transform.x = 0;
    rect.transform.y = 0;
    expect(rect.hitTest(60, 0)).toBe(false);
  });

  test('getBounds - корректность', () => {
    const rect = new Rect(100, 100);
    rect.transform.x = 50;
    rect.transform.y = 50;
    const bounds = rect.getBounds();
    expect(bounds.minX).toBeCloseTo(0);
    expect(bounds.minY).toBeCloseTo(0);
    expect(bounds.maxX).toBeCloseTo(100);
    expect(bounds.maxY).toBeCloseTo(100);
  });
});

describe('Oval', () => {
  test('hitTest - точка внутри', () => {
    const oval = new Oval(50, 30);
    oval.transform.x = 0;
    oval.transform.y = 0;
    expect(oval.hitTest(0, 0)).toBe(true);
  });

  test('hitTest - точка вне', () => {
    const oval = new Oval(50, 30);
    oval.transform.x = 0;
    oval.transform.y = 0;
    expect(oval.hitTest(60, 0)).toBe(false);
  });
});

describe('Line', () => {
  test('hitTest - точка на линии', () => {
    const line = new Line(-50, 0, 50, 0);
    line.strokeWidth = 4;
    expect(line.hitTest(0, 0)).toBe(true);
  });

  test('hitTest - точка рядом с линией', () => {
    const line = new Line(-50, 0, 50, 0);
    line.strokeWidth = 4;
    expect(line.hitTest(0, 2)).toBe(true);
  });
});

describe('Triangle', () => {
  test('hitTest - точка внутри', () => {
    const triangle = new Triangle();
    triangle.transform.x = 0;
    triangle.transform.y = 0;
    expect(triangle.hitTest(0, 0)).toBe(true);
  });

  test('hitTest - точка вне', () => {
    const triangle = new Triangle();
    triangle.transform.x = 0;
    triangle.transform.y = 0;
    expect(triangle.hitTest(50, 50)).toBe(false);
  });
});

describe('QuadraticBezier', () => {
  test('evalLocal - точка на кривой', () => {
    const bezier = new QuadraticBezier(
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 }
    );
    const point = bezier.evalLocal(0.5);
    expect(point.x).toBeCloseTo(50);
    expect(point.y).toBeCloseTo(50);
  });
});

describe('CubicBezier', () => {
  test('evalLocal - точка на кривой', () => {
    const bezier = new CubicBezier(
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 0 }
    );
    const point = bezier.evalLocal(0.5);
    expect(point.x).toBeCloseTo(50);
    expect(point.y).toBeCloseTo(75);
  });
});