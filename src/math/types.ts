// ===== 2D Types =====
export interface Vec2 {
  x: number
  y: number
}

// Mat2x2 stored as [row0, row1]
export type Mat2x2 = [[number, number], [number, number]]

// ===== 3D Types =====
export interface Vec3 {
  x: number
  y: number
  z: number
}

// Mat3x3 stored as [row0, row1, row2]
export type Mat3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
]

// ===== Common =====
export interface Complex {
  real: number
  imag: number
}

export interface EigenResult2 {
  values: Complex[] // always length 2
  vectors: Vec2[] // real eigenvectors only (may be empty)
  allReal: boolean
}

export interface EigenResult3 {
  values: Complex[] // always length 3
  vectors: Vec3[] // real eigenvectors only
  allReal: boolean
}

export interface SVDResult2 {
  U: Mat2x2
  Sigma: Vec2 // (σ₁, σ₂)
  Vt: Mat2x2
  rank: number
}

export interface SVDResult3 {
  U: Mat3x3
  Sigma: Vec3 // (σ₁, σ₂, σ₃)
  Vt: Mat3x3
  rank: number
}
