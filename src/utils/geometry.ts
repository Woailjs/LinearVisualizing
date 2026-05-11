import type { Vec3 } from '../math/types'

export interface Line2 {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export interface Line3 {
  start: Vec3
  end: Vec3
}

export function generateGrid3D(range: number): Line3[] {
  const lines: Line3[] = []
  for (let i = -range; i <= range; i++) {
    for (let j = -range; j <= range; j++) {
      lines.push({ start: { x: i, y: -range, z: j }, end: { x: i, y: range, z: j } })
      lines.push({ start: { x: -range, y: i, z: j }, end: { x: range, y: i, z: j } })
    }
    for (let j = -range; j <= range; j++) {
      lines.push({ start: { x: i, y: j, z: -range }, end: { x: i, y: j, z: range } })
      lines.push({ start: { x: -range, y: j, z: i }, end: { x: range, y: j, z: i } })
    }
    for (let j = -range; j <= range; j++) {
      lines.push({ start: { x: j, y: i, z: -range }, end: { x: j, y: i, z: range } })
      lines.push({ start: { x: j, y: -range, z: i }, end: { x: j, y: range, z: i } })
    }
  }
  return lines
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  headSize: number = 8,
) {
  const dx = toX - fromX
  const dy = toY - fromY
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 0.5) return

  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()

  const ux = dx / len
  const uy = dy / len
  const angle = Math.atan2(uy, ux)
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - headSize * Math.cos(angle - Math.PI / 6),
    toY - headSize * Math.sin(angle - Math.PI / 6),
  )
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - headSize * Math.cos(angle + Math.PI / 6),
    toY - headSize * Math.sin(angle + Math.PI / 6),
  )
  ctx.stroke()
}
