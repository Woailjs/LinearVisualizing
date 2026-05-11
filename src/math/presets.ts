import type { Mat2x2, Mat3x3 } from './types'
import { mat22, mat33 } from './matrix'

// ===== 2D Presets =====
export interface Preset22 {
  name: string
  description: string
  matrix: Mat2x2
}

export function rotation22(deg: number): Mat2x2 {
  const rad = (deg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return mat22(c, -s, s, c)
}

export function scale22(sx: number, sy: number): Mat2x2 {
  return mat22(sx, 0, 0, sy)
}

export function shearX22(k: number): Mat2x2 {
  return mat22(1, k, 0, 1)
}

export function shearY22(k: number): Mat2x2 {
  return mat22(1, 0, k, 1)
}

export function projection22(axisDeg: number): Mat2x2 {
  const rad = (axisDeg * Math.PI) / 180
  const ux = Math.cos(rad)
  const uy = Math.sin(rad)
  return mat22(ux * ux, ux * uy, ux * uy, uy * uy)
}

export function reflection22(axisDeg: number): Mat2x2 {
  const rad = (2 * axisDeg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return mat22(c, s, s, -c)
}

export const presets22: Preset22[] = [
  { name: '单位矩阵', description: '不变换', matrix: mat22(1, 0, 0, 1) },
  { name: '旋转 45°', description: '逆时针旋转 45°', matrix: rotation22(45) },
  { name: '旋转 90°', description: '逆时针旋转 90°', matrix: rotation22(90) },
  { name: '旋转 120°', description: '逆时针旋转 120°', matrix: rotation22(120) },
  { name: '放大 2x', description: '均匀放大 2 倍', matrix: scale22(2, 2) },
  { name: '横向拉伸', description: 'X 方向放大 2 倍', matrix: scale22(2, 1) },
  { name: '纵向拉伸', description: 'Y 方向放大 2 倍', matrix: scale22(1, 2) },
  { name: 'X 方向剪切', description: '沿 X 方向剪切', matrix: shearX22(1) },
  { name: 'Y 方向剪切', description: '沿 Y 方向剪切', matrix: shearY22(1) },
  { name: '投影到 X 轴', description: '投影到 X 轴（秩1）', matrix: projection22(0) },
  { name: '投影到 45°', description: '投影到 45° 线（秩1）', matrix: projection22(45) },
  { name: '反射 (X轴)', description: '关于 X 轴反射', matrix: reflection22(0) },
  { name: '挤压', description: 'X 压缩 0.5, Y 拉伸 2', matrix: scale22(0.5, 2) },
]

// ===== 3D Presets =====
export interface Preset33 {
  name: string
  description: string
  matrix: Mat3x3
}

export function rotationX33(deg: number): Mat3x3 {
  const rad = (deg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return mat33(1, 0, 0, 0, c, -s, 0, s, c)
}

export function rotationY33(deg: number): Mat3x3 {
  const rad = (deg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return mat33(c, 0, s, 0, 1, 0, -s, 0, c)
}

export function rotationZ33(deg: number): Mat3x3 {
  const rad = (deg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return mat33(c, -s, 0, s, c, 0, 0, 0, 1)
}

export function scale33(sx: number, sy: number, sz: number): Mat3x3 {
  return mat33(sx, 0, 0, 0, sy, 0, 0, 0, sz)
}

export function projection33(axisDegXY: number, axisDegZ: number): Mat3x3 {
  const phi = (axisDegXY * Math.PI) / 180
  const theta = (axisDegZ * Math.PI) / 180
  const ux = Math.cos(phi) * Math.cos(theta)
  const uy = Math.sin(phi) * Math.cos(theta)
  const uz = Math.sin(theta)
  return mat33(
    ux * ux, ux * uy, ux * uz,
    ux * uy, uy * uy, uy * uz,
    ux * uz, uy * uz, uz * uz,
  )
}

export const presets33: Preset33[] = [
  { name: '单位矩阵', description: '不变换', matrix: mat33(1, 0, 0, 0, 1, 0, 0, 0, 1) },
  { name: '绕 X 轴 45°', description: '绕 X 轴旋转 45°', matrix: rotationX33(45) },
  { name: '绕 Y 轴 45°', description: '绕 Y 轴旋转 45°', matrix: rotationY33(45) },
  { name: '绕 Z 轴 60°', description: '绕 Z 轴旋转 60°', matrix: rotationZ33(60) },
  { name: '均匀放大 2x', description: '三维均匀放大 2 倍', matrix: scale33(2, 2, 2) },
  { name: 'X 方向拉伸', description: 'X 方向放大 2 倍', matrix: scale33(2, 1, 1) },
  { name: 'XY 方向压缩', description: 'XY 压缩为一半', matrix: scale33(0.5, 0.5, 1) },
  { name: '投影到 XY 平面', description: 'Z 坐标归零（秩2）', matrix: scale33(1, 1, 0) },
  { name: '投影到 X 轴', description: '仅保留 X 分量（秩1）', matrix: scale33(1, 0, 0) },
  { name: '旋转+缩放', description: '绕 Y 轴 30° + X 拉伸', matrix: mat33(
    1.732, 0, 0.5,
    0, 1, 0,
    -0.866, 0, 1,
  )},
]
