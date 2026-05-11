import type { Vec2 } from '../../math/types'
import { angleOf } from '../../math/vector'

export interface SnapState {
  snapped: boolean
  angle: number // snapped angle (radians)
  eigenIndex: number // which eigenvector we snapped to (-1 if none)
  eigenvalue: number | null
  eigenvector: Vec2 | null
}

// Normalize angle to [-π, π]
function normalizeAngle(a: number): number {
  let na = a % (2 * Math.PI)
  if (na > Math.PI) na -= 2 * Math.PI
  if (na < -Math.PI) na += 2 * Math.PI
  return na
}

// Angular distance considering 180° equivalence (undirected vectors)
function angularDist(a: number, b: number): number {
  const d1 = Math.abs(normalizeAngle(a - b))
  return Math.min(d1, Math.PI - d1)
}

export function checkSnap(
  inputAngle: number,
  eigenvectors: Vec2[],
  eigenvalues: number[],
  thresholdDeg: number,
): SnapState {
  let bestIdx = -1
  let bestDist = Infinity
  let bestAngle = inputAngle

  for (let i = 0; i < eigenvectors.length; i++) {
    const ev = eigenvectors[i]
    const evAngle = angleOf(ev)
    const dist = angularDist(inputAngle, evAngle)

    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
      // Snap to the eigenvector direction (both forward and backward possible)
      const forwardDiff = angularDist(inputAngle, evAngle)
      const backwardDiff = angularDist(inputAngle, normalizeAngle(evAngle + Math.PI))
      if (forwardDiff <= backwardDiff) {
        bestAngle = evAngle
      } else {
        bestAngle = normalizeAngle(evAngle + Math.PI)
      }
    }
  }

  const thresholdRad = (thresholdDeg * Math.PI) / 180
  if (bestDist <= thresholdRad && bestIdx >= 0) {
    return {
      snapped: true,
      angle: bestAngle,
      eigenIndex: bestIdx,
      eigenvalue: eigenvalues[bestIdx],
      eigenvector: eigenvectors[bestIdx],
    }
  }

  return {
    snapped: false,
    angle: inputAngle,
    eigenIndex: -1,
    eigenvalue: null,
    eigenvector: null,
  }
}
