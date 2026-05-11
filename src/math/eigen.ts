import type { Vec2, Vec3, Mat2x2, Mat3x3, Complex, EigenResult2, EigenResult3 } from './types'
import { det22, trace22, det33, trace33 } from './matrix'
import { cross3, normalize3, norm3 } from './vector'

// ===== Helpers =====
function solveQuadratic(a: number, b: number, c: number): [Complex, Complex] {
  // a x² + b x + c = 0
  if (Math.abs(a) < 1e-14) {
    // degenerate: b x + c = 0
    const root = { real: -c / (b || 1e-14), imag: 0 }
    return [root, root]
  }
  const disc = b * b - 4 * a * c
  if (disc >= 0) {
    const sqrtD = Math.sqrt(disc)
    return [
      { real: (-b + sqrtD) / (2 * a), imag: 0 },
      { real: (-b - sqrtD) / (2 * a), imag: 0 },
    ]
  }
  const sqrtD = Math.sqrt(-disc)
  return [
    { real: -b / (2 * a), imag: sqrtD / (2 * a) },
    { real: -b / (2 * a), imag: -sqrtD / (2 * a) },
  ]
}

function solveCubic(a: number, b: number, c: number, d: number): [Complex, Complex, Complex] {
  // a λ³ + b λ² + c λ + d = 0
  if (Math.abs(a) < 1e-14) {
    const [r1, r2] = solveQuadratic(b, c, d)
    return [r1, r2, r1]
  }
  // normalize
  const p = (3 * a * c - b * b) / (3 * a * a)
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a)

  const disc = (q * q) / 4 + (p * p * p) / 27

  const shift = -b / (3 * a)

  if (disc > 1e-14) {
    // One real root
    const sqrtD = Math.sqrt(disc)
    const u = Math.cbrt(-q / 2 + sqrtD)
    const v = Math.cbrt(-q / 2 - sqrtD)
    const realRoot = u + v + shift
    // synthetic division to get quadratic
    const r = realRoot
    const a2 = a
    const b2 = b + a2 * r
    const c2 = c + b2 * r
    const [c1, c2v] = solveQuadratic(a2, b2, c2)
    return [{ real: realRoot, imag: 0 }, c1, c2v]
  } else {
    // Three real roots (trigonometric solution)
    const r = Math.sqrt(-p * p * p / 27)
    const phi = Math.acos(-q / (2 * r + 1e-15))
    const r_cuberoot = Math.cbrt(r + 1e-15) // actually 2*sqrt(-p/3)
    const two_sqrt = 2 * Math.sqrt(Math.max(0, -p / 3))

    return [
      { real: two_sqrt * Math.cos(phi / 3) + shift, imag: 0 },
      { real: two_sqrt * Math.cos((phi + 2 * Math.PI) / 3) + shift, imag: 0 },
      { real: two_sqrt * Math.cos((phi + 4 * Math.PI) / 3) + shift, imag: 0 },
    ]
  }
}

// ===== 2x2 Eigen =====
export function eigenvalues22(m: Mat2x2): [Complex, Complex] {
  // λ² - tr(A)λ + det(A) = 0
  return solveQuadratic(1, -trace22(m), det22(m))
}

export function eigenvector22(m: Mat2x2, lambda: number): Vec2 | null {
  // Solve (A - λI) v = 0
  const a = m[0][0] - lambda
  const b = m[0][1]
  const c = m[1][0]
  const d = m[1][1] - lambda

  if (Math.abs(a) > 1e-12 || Math.abs(b) > 1e-12) {
    return { x: -b, y: a }
  }
  if (Math.abs(c) > 1e-12 || Math.abs(d) > 1e-12) {
    return { x: -d, y: c }
  }
  return null
}

export function eigen22(m: Mat2x2): EigenResult2 {
  const vals = eigenvalues22(m)
  const allReal = vals.every(v => Math.abs(v.imag) < 1e-12)
  const vectors: Vec2[] = []

  if (allReal) {
    for (const v of vals) {
      const ev = eigenvector22(m, v.real)
      if (ev && (Math.abs(ev.x) > 1e-12 || Math.abs(ev.y) > 1e-12)) {
        // normalize
        const len = Math.sqrt(ev.x * ev.x + ev.y * ev.y)
        vectors.push({ x: ev.x / len, y: ev.y / len })
      }
    }
  }

  return { values: vals, vectors, allReal }
}

// ===== 3x3 Eigen =====
// Characteristic polynomial coefficients: λ³ + c2 λ² + c1 λ + c0 = 0
function charPoly33(m: Mat3x3): [number, number, number] {
  const c2 = -trace33(m)
  const c1 =
    m[0][0] * m[1][1] + m[0][0] * m[2][2] + m[1][1] * m[2][2] -
    m[0][1] * m[1][0] - m[0][2] * m[2][0] - m[1][2] * m[2][1]
  const c0 = -det33(m)
  return [c2, c1, c0]
}

export function eigenvalues33(m: Mat3x3): [Complex, Complex, Complex] {
  const [c2, c1, c0] = charPoly33(m)
  return solveCubic(1, c2, c1, c0)
}

export function eigenvector33(m: Mat3x3, lambda: number): Vec3 | null {
  // Solve (A - λI) v = 0
  const r0 = [m[0][0] - lambda, m[0][1], m[0][2]]
  const r1 = [m[1][0], m[1][1] - lambda, m[1][2]]
  const r2 = [m[2][0], m[2][1], m[2][2] - lambda]

  const rowVecs = [r0, r1, r2].map(r => ({ x: r[0], y: r[1], z: r[2] }))

  // Find the cross product of two non-zero (or largest) rows
  let best: Vec3 | null = null
  let bestLen = -1

  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const v = cross3(rowVecs[i], rowVecs[j])
      const len = norm3(v)
      if (len > bestLen) {
        bestLen = len
        best = v
      }
    }
  }

  if (best && bestLen > 1e-12) {
    return normalize3(best)
  }
  return null
}

export function eigen33(m: Mat3x3): EigenResult3 {
  const vals = eigenvalues33(m)
  const allReal = vals.every(v => Math.abs(v.imag) < 1e-12)
  const vectors: Vec3[] = []

  if (allReal) {
    for (const v of vals) {
      const ev = eigenvector33(m, v.real)
      if (ev) vectors.push(ev)
    }
  }

  return { values: vals, vectors, allReal }
}
