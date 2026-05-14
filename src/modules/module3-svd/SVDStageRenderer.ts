import type { Mat2x2, Mat3x3, Vec2, Vec3 } from '../../math/types'
import type { SVDResult2, SVDResult3 } from '../../math/types'
import { multiply22, identity22, identity33, multiply33, det22, det33 } from '../../math/matrix'
import { easeInOutCubic } from '../../utils/easing'

// ===== 2D SVD Stage Rendering =====

// Extract rotation angle from 2x2 matrix (assumes it's orthogonal)
function extractAngle2(m: Mat2x2): number {
  return Math.atan2(m[1][0], m[0][0])
}

// Reconstruct 2x2 rotation matrix from angle
function rotation22FromAngle(angle: number): Mat2x2 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [[c, -s], [s, c]]
}

// Interpolate an orthogonal 2x2 matrix from I to Q
function interpolateOrtho2(Q: Mat2x2, t: number): Mat2x2 {
  if (t >= 1) return Q
  if (t <= 0) return identity22()

  const det = det22(Q)
  if (det > 0) {
    // Pure rotation
    const angle = extractAngle2(Q)
    return rotation22FromAngle(angle * t)
  } else {
    // Reflection: Q = R * F where R is rotation, F is reflection across x-axis
    // Factor out reflection: Q * F^(-1) = R, and F = F^(-1) for reflection
    const F: Mat2x2 = [[1, 0], [0, -1]]
    const R = multiply22(Q, F) // Q * F = R (should be pure rotation)
    const angle = extractAngle2(R)
    const Rt = rotation22FromAngle(angle * t)
    // Interpolated = lerp from I to R, then apply F at constant rate
    // Actually: interpolate F from I to F, then R from I to R
    // Simpler: just lerp the angle of the rotation part, and also lerp the reflection
    const fI: Mat2x2 = identity22()
    const Ft: Mat2x2 = [
      [fI[0][0] + (F[0][0] - fI[0][0]) * t, fI[0][1] + (F[0][1] - fI[0][1]) * t],
      [fI[1][0] + (F[1][0] - fI[1][0]) * t, fI[1][1] + (F[1][1] - fI[1][1]) * t],
    ]
    return multiply22(Rt, Ft)
  }
}

// Compute the effective 2D transformation at a given progress value
export function computeTransform2D(svd: SVDResult2, progress: number): Mat2x2 {
  const t = Math.max(0, Math.min(3, progress))

  // Stage 1: V^T
  const t1 = easeInOutCubic(Math.min(1, t))
  const Vt_t = interpolateOrtho2(svd.Vt, t1)

  if (t <= 1) return Vt_t

  // Stage 2: Σ
  const t2 = easeInOutCubic(Math.min(1, t - 1))
  const I: Mat2x2 = identity22()
  const Sigma_t: Mat2x2 = [
    [I[0][0] + (svd.Sigma.x - I[0][0]) * t2, I[0][1]],
    [I[1][0], I[1][1] + (svd.Sigma.y - I[1][1]) * t2],
  ]
  const stage2 = multiply22(Sigma_t, svd.Vt)

  if (t <= 2) return stage2

  // Stage 3: U
  const t3 = easeInOutCubic(Math.min(1, t - 2))
  const U_t = interpolateOrtho2(svd.U, t3)
  return multiply22(U_t, multiply22([[svd.Sigma.x, 0], [0, svd.Sigma.y]], svd.Vt))
}

// ===== 3D SVD Stage Rendering =====

// Extract rotation axis and angle from 3x3 orthogonal matrix
function extractRotation3(Q: Mat3x3): { axis: Vec3; angle: number } | null {
  const trace = Q[0][0] + Q[1][1] + Q[2][2]
  const cosA = (trace - 1) / 2
  const clamped = Math.max(-1, Math.min(1, cosA))
  const angle = Math.acos(clamped)

  if (Math.abs(angle) < 1e-10) {
    return { axis: { x: 1, y: 0, z: 0 }, angle: 0 }
  }
  if (Math.abs(angle - Math.PI) < 1e-10) {
    // 180 degree rotation: find axis from diagonal
    const x = Math.sqrt(Math.max(0, (Q[0][0] + 1) / 2))
    const y = Math.sqrt(Math.max(0, (Q[1][1] + 1) / 2))
    const z = Math.sqrt(Math.max(0, (Q[2][2] + 1) / 2))
    // Determine signs from off-diagonals
    const sx = Q[2][1] - Q[1][2] >= 0 ? 1 : -1
    const sy = Q[0][2] - Q[2][0] >= 0 ? 1 : -1
    const sz = Q[1][0] - Q[0][1] >= 0 ? 1 : -1
    return { axis: { x: x * sx, y: y * sy, z: z * sz }, angle: Math.PI }
  }

  const s = 1 / (2 * Math.sin(angle))
  return {
    axis: {
      x: (Q[2][1] - Q[1][2]) * s,
      y: (Q[0][2] - Q[2][0]) * s,
      z: (Q[1][0] - Q[0][1]) * s,
    },
    angle,
  }
}

// Rodrigues rotation formula: build 3x3 rotation from axis and angle
function rotation33Rodrigues(axis: Vec3, angle: number): Mat3x3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const t = 1 - c
  const x = axis.x, y = axis.y, z = axis.z
  return [
    [c + x * x * t, x * y * t - z * s, x * z * t + y * s],
    [y * x * t + z * s, c + y * y * t, y * z * t - x * s],
    [z * x * t - y * s, z * y * t + x * s, c + z * z * t],
  ]
}

function interpolateOrtho3(Q: Mat3x3, t: number): Mat3x3 {
  if (t >= 1) return Q
  if (t <= 0) return identity33()

  const det = det33(Q)
  if (det > 0) {
    const extracted = extractRotation3(Q)
    if (!extracted) return identity33()
    return rotation33Rodrigues(extracted.axis, extracted.angle * t)
  } else {
    // Reflection: factor out by flipping z-axis sign
    const F: Mat3x3 = [[1, 0, 0], [0, 1, 0], [0, 0, -1]]
    const R = multiply33(Q, F)
    const extracted = extractRotation3(R)
    if (!extracted) {
      // Fallback: linear interpolation
      const I = identity33()
      return [
        [I[0][0] + (Q[0][0] - I[0][0]) * t, I[0][1] + (Q[0][1] - I[0][1]) * t, I[0][2] + (Q[0][2] - I[0][2]) * t],
        [I[1][0] + (Q[1][0] - I[1][0]) * t, I[1][1] + (Q[1][1] - I[1][1]) * t, I[1][2] + (Q[1][2] - I[1][2]) * t],
        [I[2][0] + (Q[2][0] - I[2][0]) * t, I[2][1] + (Q[2][1] - I[2][1]) * t, I[2][2] + (Q[2][2] - I[2][2]) * t],
      ]
    }
    const Rt = rotation33Rodrigues(extracted.axis, extracted.angle * t)
    // Interpolate F
    const I33 = identity33()
    const Ft: Mat3x3 = [
      [I33[0][0] + (F[0][0] - I33[0][0]) * t, I33[0][1], I33[0][2]],
      [I33[1][0], I33[1][1] + (F[1][1] - I33[1][1]) * t, I33[1][2]],
      [I33[2][0], I33[2][1], I33[2][2] + (F[2][2] - I33[2][2]) * t],
    ]
    return multiply33(Rt, Ft)
  }
}

// Compute the effective 2D transformation from A through B's SVD stages
// Stage 1 [0,1]: V^T_t × A
// Stage 2 [1,2]: Σ_t × V^T × A
// Stage 3 [2,3]: U_t × Σ × V^T × A = B × A = C
export function computeTransformFromA2D(svdB: SVDResult2, matrixA: Mat2x2, progress: number): Mat2x2 {
  const t = Math.max(0, Math.min(3, progress))

  // Stage 1: apply interpolated V^T to A
  const t1 = easeInOutCubic(Math.min(1, t))
  const Vt_t = interpolateOrtho2(svdB.Vt, t1)
  const stage1 = multiply22(Vt_t, matrixA)
  if (t <= 1) return stage1

  // Stage 2: apply interpolated Σ after full V^T
  const t2 = easeInOutCubic(Math.min(1, t - 1))
  const I2 = identity22()
  const Sigma_t: Mat2x2 = [
    [I2[0][0] + (svdB.Sigma.x - I2[0][0]) * t2, I2[0][1]],
    [I2[1][0], I2[1][1] + (svdB.Sigma.y - I2[1][1]) * t2],
  ]
  const stage2 = multiply22(Sigma_t, multiply22(svdB.Vt, matrixA))
  if (t <= 2) return stage2

  // Stage 3: apply interpolated U after full Σ × V^T
  const t3 = easeInOutCubic(Math.min(1, t - 2))
  const U_t = interpolateOrtho2(svdB.U, t3)
  const Sigma_full: Mat2x2 = [[svdB.Sigma.x, 0], [0, svdB.Sigma.y]]
  return multiply22(U_t, multiply22(Sigma_full, multiply22(svdB.Vt, matrixA)))
}

export function computeTransform3D(svd: SVDResult3, progress: number): Mat3x3 {
  const t = Math.max(0, Math.min(3, progress))

  // Stage 1: V^T
  const t1 = easeInOutCubic(Math.min(1, t))
  const Vt_t = interpolateOrtho3(svd.Vt, t1)
  if (t <= 1) return Vt_t

  // Stage 2: Σ
  const t2 = easeInOutCubic(Math.min(1, t - 1))
  const I = identity33()
  const Sigma_t: Mat3x3 = [
    [I[0][0] + (svd.Sigma.x - I[0][0]) * t2, 0, 0],
    [0, I[1][1] + (svd.Sigma.y - I[1][1]) * t2, 0],
    [0, 0, I[2][2] + (svd.Sigma.z - I[2][2]) * t2],
  ]
  const stage2 = multiply33(Sigma_t, svd.Vt)
  if (t <= 2) return stage2

  // Stage 3: U
  const t3 = easeInOutCubic(Math.min(1, t - 2))
  const U_t = interpolateOrtho3(svd.U, t3)
  return multiply33(U_t, multiply33(
    [[svd.Sigma.x, 0, 0], [0, svd.Sigma.y, 0], [0, 0, svd.Sigma.z]],
    svd.Vt,
  ))
}

// Compute the effective 3D transformation from A through B's SVD stages
// Stage 1 [0,1]: V^T_t × A
// Stage 2 [1,2]: Σ_t × V^T × A
// Stage 3 [2,3]: U_t × Σ × V^T × A = B × A = C
export function computeTransformFromA3D(svdB: SVDResult3, matrixA: Mat3x3, progress: number): Mat3x3 {
  const t = Math.max(0, Math.min(3, progress))

  // Stage 1: apply interpolated V^T to A
  const t1 = easeInOutCubic(Math.min(1, t))
  const Vt_t = interpolateOrtho3(svdB.Vt, t1)
  const stage1 = multiply33(Vt_t, matrixA)
  if (t <= 1) return stage1

  // Stage 2: apply interpolated Σ after full V^T
  const t2 = easeInOutCubic(Math.min(1, t - 1))
  const I3 = identity33()
  const Sigma_t: Mat3x3 = [
    [I3[0][0] + (svdB.Sigma.x - I3[0][0]) * t2, 0, 0],
    [0, I3[1][1] + (svdB.Sigma.y - I3[1][1]) * t2, 0],
    [0, 0, I3[2][2] + (svdB.Sigma.z - I3[2][2]) * t2],
  ]
  const stage2 = multiply33(Sigma_t, multiply33(svdB.Vt, matrixA))
  if (t <= 2) return stage2

  // Stage 3: apply interpolated U after full Σ × V^T
  const t3 = easeInOutCubic(Math.min(1, t - 2))
  const U_t = interpolateOrtho3(svdB.U, t3)
  const Sigma_full: Mat3x3 = [[svdB.Sigma.x, 0, 0], [0, svdB.Sigma.y, 0], [0, 0, svdB.Sigma.z]]
  return multiply33(U_t, multiply33(Sigma_full, multiply33(svdB.Vt, matrixA)))
}
