import type { Vec2, Vec3, Mat2x2, Mat3x3, SVDResult2, SVDResult3 } from './types'
import { apply22, transpose22, identity22, det22, trace22, multiply22, identity33, multiply33, transpose33, apply33, det33 } from './matrix'
import { scale2, normalize2, dot2, norm2, scale3, normalize3, dot3, norm3, cross3 } from './vector'

const EPS = 1e-10

// ===== 2x2 SVD =====
// Compute AᵀA, find eigenvalues/vectors directly
export function svd22(A: Mat2x2): SVDResult2 {
  const AtA = multiply22(transpose22(A), A)

  // Eigenvalues of 2x2 symmetric matrix
  const tr = trace22(AtA)
  const det = det22(AtA)
  const disc = tr * tr / 4 - det

  let sigma1: number, sigma2: number
  let v1: Vec2, v2: Vec2

  if (disc < EPS) {
    // Equal singular values: tr/2 is the eigenvalue
    sigma1 = sigma2 = Math.sqrt(Math.max(0, tr / 2))
    v1 = { x: 1, y: 0 }
    v2 = { x: 0, y: 1 }
  } else {
    const sqrtD = Math.sqrt(disc)
    const lambda1 = tr / 2 + sqrtD
    const lambda2 = tr / 2 - sqrtD
    sigma1 = Math.sqrt(Math.max(0, lambda1))
    sigma2 = Math.sqrt(Math.max(0, lambda2))

    // Eigenvector for λ1
    const a = AtA[0][0] - lambda1
    const b = AtA[0][1]
    v1 = normalize2({ x: -b, y: a })
    if (norm2(v1) < EPS) v1 = { x: 1, y: 0 }

    // Eigenvector for λ2 (orthogonal)
    const a2 = AtA[0][0] - lambda2
    const b2 = AtA[0][1]
    v2 = normalize2({ x: -b2, y: a2 })
    if (norm2(v2) < EPS) v2 = { x: -v1.y, y: v1.x }
  }

  // Ensure V has positive determinant (pure rotation, no reflection)
  const V: Mat2x2 = [[v1.x, v2.x], [v1.y, v2.y]]
  if (det22(V) < 0) {
    // Flip sign of v2
    v2 = scale2(v2, -1)
  }

  const Vt: Mat2x2 = [[v1.x, v1.y], [v2.x, v2.y]]

  // U columns: u_i = (1/σ_i) A v_i
  const u1v = apply22(A, v1)
  const u2v = apply22(A, v2)

  let u1: Vec2, u2: Vec2
  if (sigma1 > EPS) {
    u1 = scale2(u1v, 1 / sigma1)
  } else {
    u1 = { x: 1, y: 0 }
  }
  if (sigma2 > EPS) {
    u2 = scale2(u2v, 1 / sigma2)
  } else {
    u2 = { x: -u1.y, y: u1.x }
  }

  const U: Mat2x2 = [[u1.x, u2.x], [u1.y, u2.y]]

  const rank = (sigma1 > EPS ? 1 : 0) + (sigma2 > EPS ? 1 : 0)

  return { U, Sigma: { x: sigma1, y: sigma2 }, Vt, rank }
}

// ===== 3x3 SVD via Jacobi on AᵀA =====
function jacobi3(A: number[][]): { values: number[]; vectors: number[][] } {
  // Jacobi eigenvalue algorithm for 3x3 symmetric matrix
  // Returns eigenvalues in descending order and eigenvectors as columns
  const n = 3
  const V: number[][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  const M = A.map(r => [...r])
  const MAX_ITER = 50

  for (let iter = 0; iter < MAX_ITER; iter++) {
    // Find largest off-diagonal
    let maxOff = 0
    let p = 0, q = 1
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(M[i][j]) > maxOff) {
          maxOff = Math.abs(M[i][j])
          p = i; q = j
        }
      }
    }

    if (maxOff < 1e-14) break

    // Compute Jacobi rotation
    const theta = (M[q][q] - M[p][p]) / (2 * M[p][q])
    const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
    const c = 1 / Math.sqrt(t * t + 1)
    const s = c * t

    // Apply rotation to M (both sides)
    const mpp = M[p][p]
    const mqq = M[q][q]
    M[p][p] = c * c * mpp - 2 * s * c * M[p][q] + s * s * mqq
    M[q][q] = s * s * mpp + 2 * s * c * M[p][q] + c * c * mqq
    M[p][q] = 0
    M[q][p] = 0

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const mip = M[i][p]
        const miq = M[i][q]
        M[i][p] = c * mip - s * miq
        M[p][i] = M[i][p]
        M[i][q] = s * mip + c * miq
        M[q][i] = M[i][q]
      }
    }

    // Update eigenvectors
    for (let i = 0; i < n; i++) {
      const vip = V[i][p]
      const viq = V[i][q]
      V[i][p] = c * vip - s * viq
      V[i][q] = s * vip + c * viq
    }
  }

  // Extract eigenvalues (diagonal of M)
  const values = [M[0][0], M[1][1], M[2][2]]

  // Sort descending
  const indices = [0, 1, 2].sort((a, b) => values[b] - values[a])
  const sortedValues = indices.map(i => Math.max(0, values[i]))
  const sortedVectors = indices.map(i => [V[0][i], V[1][i], V[2][i]])

  return { values: sortedValues, vectors: sortedVectors }
}

export function svd33(A: Mat3x3): SVDResult3 {
  const AtA = multiply33(transpose33(A), A)
  const AtAarr = [
    [AtA[0][0], AtA[0][1], AtA[0][2]],
    [AtA[1][0], AtA[1][1], AtA[1][2]],
    [AtA[2][0], AtA[2][1], AtA[2][2]],
  ]

  const { values: lambdas, vectors: Vcols } = jacobi3(AtAarr)

  const sigma1 = Math.sqrt(Math.max(0, lambdas[0]))
  const sigma2 = Math.sqrt(Math.max(0, lambdas[1]))
  const sigma3 = Math.sqrt(Math.max(0, lambdas[2]))

  // Build V and Vᵀ
  const V: Mat3x3 = [
    [Vcols[0][0], Vcols[1][0], Vcols[2][0]],
    [Vcols[0][1], Vcols[1][1], Vcols[2][1]],
    [Vcols[0][2], Vcols[1][2], Vcols[2][2]],
  ]

  // Ensure right-handed: det(V) > 0, else flip last column
  if (det33(V) < 0) {
    V[0][2] *= -1; V[1][2] *= -1; V[2][2] *= -1
  }

  const Vt: Mat3x3 = transpose33(V)

  // Build U columns from A v_i / σ_i
  const sigmas = [sigma1, sigma2, sigma3]
  const uCols: Vec3[] = []

  for (let i = 0; i < 3; i++) {
    const vi: Vec3 = { x: V[0][i], y: V[1][i], z: V[2][i] }
    const Avi = apply33(A, vi)
    if (sigmas[i] > EPS) {
      uCols.push(scale3(Avi, 1 / sigmas[i]))
    } else {
      uCols.push(Avi) // zero column placeholder
    }
  }

  // Fill missing U columns via Gram-Schmidt
  for (let i = 0; i < 3; i++) {
    if (sigmas[i] < EPS) {
      // Find a vector not in the span of existing u columns
      let cand = { x: 1, y: 0, z: 0 }
      if (i === 0) cand = { x: 1, y: 0, z: 0 }
      else if (i === 1) cand = { x: 0, y: 1, z: 0 }
      else cand = { x: 0, y: 0, z: 1 }

      // Orthogonalize against all non-zero u columns
      for (let j = 0; j < 3; j++) {
        if (j !== i && sigmas[j] > EPS) {
          const proj = scale3(uCols[j], dot3(cand, uCols[j]))
          cand = { x: cand.x - proj.x, y: cand.y - proj.y, z: cand.z - proj.z }
        }
      }
      const n = norm3(cand)
      if (n > EPS) {
        uCols[i] = scale3(cand, 1 / n)
      }
    }
  }

  const U: Mat3x3 = [
    [uCols[0].x, uCols[1].x, uCols[2].x],
    [uCols[0].y, uCols[1].y, uCols[2].y],
    [uCols[0].z, uCols[1].z, uCols[2].z],
  ]

  const rank = sigmas.filter(s => s > EPS).length

  return { U, Sigma: { x: sigma1, y: sigma2, z: sigma3 }, Vt, rank }
}
