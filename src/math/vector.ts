import type { Vec2, Vec3 } from './types'

// ===== Vec2 =====
export function vec2(x: number, y: number): Vec2 {
  return { x, y }
}

export function add2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale2(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s }
}

export function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function norm2(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

export function normalize2(v: Vec2): Vec2 {
  const n = norm2(v)
  if (n < 1e-12) return { x: 0, y: 0 }
  return { x: v.x / n, y: v.y / n }
}

export function angle2(a: Vec2, b: Vec2): number {
  return Math.acos(dot2(a, b) / (norm2(a) * norm2(b) + 1e-15))
}

export function rotate2(v: Vec2, rad: number): Vec2 {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }
}

export function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

export function angleOf(v: Vec2): number {
  return Math.atan2(v.y, v.x)
}

// ===== Vec3 =====
export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z }
}

export function add3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function sub3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function scale3(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s }
}

export function dot3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

export function norm3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

export function normalize3(v: Vec3): Vec3 {
  const n = norm3(v)
  if (n < 1e-12) return { x: 0, y: 0, z: 0 }
  return { x: v.x / n, y: v.y / n, z: v.z / n }
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }
}
