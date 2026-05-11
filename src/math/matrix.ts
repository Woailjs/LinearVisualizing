import type { Vec2, Vec3, Mat2x2, Mat3x3 } from './types'

// ===== Mat2x2 =====
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

export function inverse22(m: Mat2x2): Mat2x2 | null {
  const d = det22(m)
  if (Math.abs(d) < 1e-15) return null
  return [
    [m[1][1] / d, -m[0][1] / d],
    [-m[1][0] / d, m[0][0] / d],
  ]
}

// ===== Mat3x3 =====
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

export function inverse33(m: Mat3x3): Mat3x3 | null {
  const d = det33(m)
  if (Math.abs(d) < 1e-15) return null

  const inv = [
    [
      (m[1][1] * m[2][2] - m[1][2] * m[2][1]) / d,
      (m[0][2] * m[2][1] - m[0][1] * m[2][2]) / d,
      (m[0][1] * m[1][2] - m[0][2] * m[1][1]) / d,
    ],
    [
      (m[1][2] * m[2][0] - m[1][0] * m[2][2]) / d,
      (m[0][0] * m[2][2] - m[0][2] * m[2][0]) / d,
      (m[0][2] * m[1][0] - m[0][0] * m[1][2]) / d,
    ],
    [
      (m[1][0] * m[2][1] - m[1][1] * m[2][0]) / d,
      (m[0][1] * m[2][0] - m[0][0] * m[2][1]) / d,
      (m[0][0] * m[1][1] - m[0][1] * m[1][0]) / d,
    ],
  ]
  return inv as Mat3x3
}

export function mat33From22(m: Mat2x2): Mat3x3 {
  return [
    [m[0][0], m[0][1], 0],
    [m[1][0], m[1][1], 0],
    [0, 0, 1],
  ]
}
