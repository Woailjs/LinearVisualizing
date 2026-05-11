import type { Vec3 } from '../../math/types'
import { dot3, scale3, sub3 } from '../../math/vector'

// Given a set of 3D points, project them toward a collapsed subspace
// based on which singular values are near zero.
// collapsedDims: indices of sigma that are near zero (0-based)
// V columns indicate the directions being collapsed
// t: interpolation factor [0, 1] for the collapse amount
export function collapsePoints(
  points: Vec3[],
  V: Vec3[], // columns of V (directions in original space)
  sigmas: number[],
  t: number,
  eps: number = 0.001,
): Vec3[] {
  if (t <= 0) return points

  return points.map(p => {
    let result = { ...p }

    for (let i = 0; i < sigmas.length; i++) {
      if (sigmas[i] < eps) {
        // Project out the component along this direction
        const vi = V[i]
        const coord = dot3(result, vi)
        // Linearly reduce the coordinate toward 0
        const newCoord = coord * (1 - t)
        const delta = scale3(vi, newCoord - coord)
        result = { x: result.x + delta.x, y: result.y + delta.y, z: result.z + delta.z }
      } else if (sigmas[i] < 0.05) {
        // Near-singular: partial collapse
        const vi = V[i]
        const coord = dot3(result, vi)
        const reduction = 1 - t * (1 - sigmas[i])
        const newCoord = coord * reduction
        const delta = scale3(vi, newCoord - coord)
        result = { x: result.x + delta.x, y: result.y + delta.y, z: result.z + delta.z }
      }
    }

    return result
  })
}

// Generate box wireframe points spanning [-range, range]^3 at integer coords
export function generateBoxPoints(range: number): Vec3[] {
  const points: Vec3[] = []
  for (let x = -range; x <= range; x++) {
    for (let y = -range; y <= range; y++) {
      for (let z = -range; z <= range; z++) {
        points.push({ x, y, z })
      }
    }
  }
  return points
}

// Generate edges connecting adjacent integer points in 3D
export interface Edge {
  a: number // index into points
  b: number
}

export function generateBoxEdges(range: number): Edge[] {
  const size = range * 2 + 1
  const idx = (x: number, y: number, z: number) =>
    (x + range) * size * size + (y + range) * size + (z + range)

  const edges: Edge[] = []
  for (let x = -range; x <= range; x++) {
    for (let y = -range; y <= range; y++) {
      for (let z = -range; z <= range; z++) {
        if (x < range) edges.push({ a: idx(x, y, z), b: idx(x + 1, y, z) })
        if (y < range) edges.push({ a: idx(x, y, z), b: idx(x, y + 1, z) })
        if (z < range) edges.push({ a: idx(x, y, z), b: idx(x, y, z + 1) })
      }
    }
  }
  return edges
}
