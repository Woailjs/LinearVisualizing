import type { Vec2, Vec3, Mat2x2, Mat3x3 } from './types'

export function identity22(): Mat2x2 {
  return [[1, 0], [0, 1]]
}

export function mat22(a: number, b: number, c: number, d: number): Mat2x2 {
  return [[a, b], [c, d]]
}

export function apply22(m: Mat2x2, v: Vec2): Vec2 {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y,
    y: m[1][0] * v.x + m[1][1] * v.y,
  }
}

export function multiply22(a: Mat2x2, b: Mat2x2): Mat2x2 {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1],
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1],
    ],
  ]
}

export function det22(m: Mat2x2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0]
}

export function trace22(m: Mat2x2): number {
  return m[0][0] + m[1][1]
}

export function transpose22(m: Mat2x2): Mat2x2 {
  return [[m[0][0], m[1][0]], [m[0][1], m[1][1]]]
}

export function identity33(): Mat3x3 {
  return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
}

export function mat33(
  a11: number, a12: number, a13: number,
  a21: number, a22: number, a23: number,
  a31: number, a32: number, a33: number,
): Mat3x3 {
  return [[a11, a12, a13], [a21, a22, a23], [a31, a32, a33]]
}

export function apply33(m: Mat3x3, v: Vec3): Vec3 {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
  }
}

export function multiply33(a: Mat3x3, b: Mat3x3): Mat3x3 {
  const result: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += a[i][k] * b[k][j]
      }
    }
  }
  return result as Mat3x3
}

export function det33(m: Mat3x3): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  )
}

export function trace33(m: Mat3x3): number {
  return m[0][0] + m[1][1] + m[2][2]
}

export function transpose33(m: Mat3x3): Mat3x3 {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ]
}

export function isIdentity22(m: Mat2x2): boolean {
  return (
    m[0][0] === 1 && m[0][1] === 0 &&
    m[1][0] === 0 && m[1][1] === 1
  )
}

export function isIdentity33(m: Mat3x3): boolean {
  return (
    m[0][0] === 1 && m[0][1] === 0 && m[0][2] === 0 &&
    m[1][0] === 0 && m[1][1] === 1 && m[1][2] === 0 &&
    m[2][0] === 0 && m[2][1] === 0 && m[2][2] === 1
  )
}

export function lerpMatrix22(a: Mat2x2, b: Mat2x2, t: number): Mat2x2 {
  return [
    [a[0][0] + (b[0][0] - a[0][0]) * t, a[0][1] + (b[0][1] - a[0][1]) * t],
    [a[1][0] + (b[1][0] - a[1][0]) * t, a[1][1] + (b[1][1] - a[1][1]) * t],
  ]
}

export function lerpMatrix33(a: Mat3x3, b: Mat3x3, t: number): Mat3x3 {
  return [
    [a[0][0] + (b[0][0] - a[0][0]) * t, a[0][1] + (b[0][1] - a[0][1]) * t, a[0][2] + (b[0][2] - a[0][2]) * t],
    [a[1][0] + (b[1][0] - a[1][0]) * t, a[1][1] + (b[1][1] - a[1][1]) * t, a[1][2] + (b[1][2] - a[1][2]) * t],
    [a[2][0] + (b[2][0] - a[2][0]) * t, a[2][1] + (b[2][1] - a[2][1]) * t, a[2][2] + (b[2][2] - a[2][2]) * t],
  ]
}
