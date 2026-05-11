import * as THREE from 'three'
import type { Mat3x3, Vec3 } from '../../math/types'
import { apply33 } from '../../math/matrix'
import { generateGrid3D, type Line3 } from '../../utils/geometry'

const GRID_RANGE = 3
const staticGrid3D: Line3[] = generateGrid3D(GRID_RANGE)

export class Scene3DRenderer {
  private refGroup: THREE.Group
  private transGroup: THREE.Group
  private arrowGroup: THREE.Group

  // Reusable materials
  private refGridMat: THREE.LineBasicMaterial
  private transGridMat: THREE.LineBasicMaterial
  private refArrowMats: THREE.LineDashedMaterial[]
  private transArrowMats: THREE.LineBasicMaterial[]
  private refConeMats: THREE.MeshBasicMaterial[]
  private transConeMats: THREE.MeshBasicMaterial[]

  // Shared cone geometry (identical for all arrows)
  private coneGeom: THREE.ConeGeometry

  // Pre-allocated transformed grid lines (buffer updated each frame)
  private transGridLines: THREE.Line[]

  // Pre-allocated transformed arrow components
  private transArrowLines: THREE.Line[]
  private transArrowCones: THREE.Mesh[]

  // Reference cone meshes (for disposal)
  private refArrowCones: THREE.Mesh[]

  constructor(private scene: THREE.Scene) {
    // Groups
    this.refGroup = new THREE.Group()
    this.transGroup = new THREE.Group()
    this.arrowGroup = new THREE.Group()
    scene.add(this.refGroup)
    scene.add(this.transGroup)
    scene.add(this.arrowGroup)

    // ---- Materials (created once, never recreated) ----
    this.refGridMat = new THREE.LineBasicMaterial({ color: 0x666688, transparent: true, opacity: 0.4 })
    this.transGridMat = new THREE.LineBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.7 })

    const refColors = [0xff8888, 0x88ff88, 0xffaa77]
    const refOpacity = 0.45
    this.refArrowMats = refColors.map(c =>
      new THREE.LineDashedMaterial({ color: c, transparent: true, opacity: refOpacity, dashSize: 0.3, gapSize: 0.2 }),
    )
    this.refConeMats = refColors.map(c =>
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: Math.min(1, refOpacity + 0.3) }),
    )

    const transColors = [0xff2222, 0x22ff22, 0xff6600]
    this.transArrowMats = transColors.map(c =>
      new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 1 }),
    )
    this.transConeMats = transColors.map(c =>
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1 }),
    )

    // Shared cone geometry
    this.coneGeom = new THREE.ConeGeometry(0.08, 0.25, 8, 8)

    // ---- Static reference objects (built once) ----
    this.buildRefGrid()
    this.refArrowCones = this.buildRefArrows()

    // ---- Pre-allocated dynamic objects (updated in render) ----
    this.transGridLines = this.buildTransGridLines()
    this.transArrowLines = []
    this.transArrowCones = []
    for (let i = 0; i < 3; i++) {
      const [line, cone] = this.buildTransArrow(i)
      this.transArrowLines.push(line)
      this.transArrowCones.push(cone)
    }
  }

  // ---- Construction helpers ----

  private buildRefGrid() {
    for (const line of staticGrid3D) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(line.start.x, line.start.z, -line.start.y),
        new THREE.Vector3(line.end.x, line.end.z, -line.end.y),
      ])
      this.refGroup.add(new THREE.Line(geom, this.refGridMat))
    }
  }

  private buildRefArrows(): THREE.Mesh[] {
    const cones: THREE.Mesh[] = []
    const dirs: [number, number, number][] = [[1, 0, 0], [0, 0, -1], [0, 1, 0]]
    for (let i = 0; i < 3; i++) {
      cones.push(this.addStaticArrow(this.refGroup, [0, 0, 0], dirs[i], i, true))
    }
    return cones
  }

  private addStaticArrow(
    group: THREE.Group,
    from: [number, number, number],
    to: [number, number, number],
    idx: number,
    dashed: boolean,
  ): THREE.Mesh {
    const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2])
    const len = dir.length()
    if (len < 0.01) return new THREE.Mesh() // never used
    dir.normalize()

    const mat = dashed ? this.refArrowMats[idx] : this.transArrowMats[idx]

    const origin = new THREE.Vector3(from[0], from[1], from[2])
    const lineGeom = new THREE.BufferGeometry().setFromPoints([origin, new THREE.Vector3(to[0], to[1], to[2])])
    const l = new THREE.Line(lineGeom, mat)
    if (dashed) l.computeLineDistances()
    group.add(l)

    const cone = new THREE.Mesh(this.coneGeom, dashed ? this.refConeMats[idx] : this.transConeMats[idx])
    cone.position.copy(new THREE.Vector3(to[0], to[1], to[2]))
    const defaultDir = new THREE.Vector3(0, 1, 0)
    const quat = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir)
    cone.setRotationFromQuaternion(quat)
    group.add(cone)
    return cone
  }

  private buildTransGridLines(): THREE.Line[] {
    const lines: THREE.Line[] = []
    for (let i = 0; i < staticGrid3D.length; i++) {
      const positions = new Float32Array(6) // 2 points × 3 coords
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const l = new THREE.Line(geom, this.transGridMat)
      this.transGroup.add(l)
      lines.push(l)
    }
    return lines
  }

  private buildTransArrow(idx: number): [THREE.Line, THREE.Mesh] {
    const positions = new Float32Array(6)
    const lineGeom = new THREE.BufferGeometry()
    lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const l = new THREE.Line(lineGeom, this.transArrowMats[idx])
    this.arrowGroup.add(l)

    const cone = new THREE.Mesh(this.coneGeom, this.transConeMats[idx])
    this.arrowGroup.add(cone)
    return [l, cone]
  }

  // ---- Per-frame render (zero allocations except Vec3 temps & Quaternion) ----

  render(matrix: Mat3x3, _dt: number) {
    // Update transformed grid lines
    for (let i = 0; i < staticGrid3D.length; i++) {
      const sl = staticGrid3D[i]
      const t1 = apply33(matrix, sl.start)
      const t2 = apply33(matrix, sl.end)
      const pos = this.transGridLines[i].geometry.attributes.position.array as Float32Array
      pos[0] = t1.x; pos[1] = t1.z; pos[2] = -t1.y
      pos[3] = t2.x; pos[4] = t2.z; pos[5] = -t2.y
      this.transGridLines[i].geometry.attributes.position.needsUpdate = true
    }

    // Compute transformed basis vectors
    const ti = apply33(matrix, { x: 1, y: 0, z: 0 })
    const tj = apply33(matrix, { x: 0, y: 1, z: 0 })
    const tk = apply33(matrix, { x: 0, y: 0, z: 1 })
    const tips: [number, number, number][] = [
      [ti.x, ti.z, -ti.y],
      [tj.x, tj.z, -tj.y],
      [tk.x, tk.z, -tk.y],
    ]

    const _dir = new THREE.Vector3()
    const _quat = new THREE.Quaternion()
    const _up = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < 3; i++) {
      const [tx, ty, tz] = tips[i]

      // Update arrow line buffer
      const pos = this.transArrowLines[i].geometry.attributes.position.array as Float32Array
      pos[0] = 0; pos[1] = 0; pos[2] = 0
      pos[3] = tx; pos[4] = ty; pos[5] = tz
      this.transArrowLines[i].geometry.attributes.position.needsUpdate = true

      // Update cone position & rotation
      const cone = this.transArrowCones[i]
      cone.position.set(tx, ty, tz)
      _dir.set(tx, ty, tz)
      const len = _dir.length()
      if (len > 0.01) {
        _dir.normalize()
        _quat.setFromUnitVectors(_up, _dir)
        cone.setRotationFromQuaternion(_quat)
        cone.visible = true
      } else {
        cone.visible = false
      }
    }
  }

  dispose() {
    // Dispose reference group children
    this.refGroup.traverse(child => {
      if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
        child.geometry?.dispose()
      }
    })

    // Dispose dynamic objects
    for (const line of this.transGridLines) line.geometry.dispose()
    for (const line of this.transArrowLines) line.geometry.dispose()
    this.coneGeom.dispose()

    // Dispose all materials
    this.refGridMat.dispose()
    this.transGridMat.dispose()
    this.refArrowMats.forEach(m => m.dispose())
    this.transArrowMats.forEach(m => m.dispose())
    this.refConeMats.forEach(m => m.dispose())
    this.transConeMats.forEach(m => m.dispose())

    this.refGroup.clear()
    this.transGroup.clear()
    this.arrowGroup.clear()
  }
}
