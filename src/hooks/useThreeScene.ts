import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function useThreeScene(
  render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, dt: number) => void,
  active: boolean = true,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const renderRef = useRef(render)
  renderRef.current = render
  const rafRef = useRef<number>(0)
  const prevTimeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !active) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a2e')
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100,
    )
    camera.position.set(8, 6, 8)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.minDistance = 2
    controls.maxDistance = 20
    controlsRef.current = controls

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444466, 0x222244)
    scene.add(gridHelper)

    const loop = (timestamp: number) => {
      if (prevTimeRef.current === undefined) prevTimeRef.current = timestamp
      const dt = Math.min((timestamp - prevTimeRef.current) / 1000, 0.1)
      prevTimeRef.current = timestamp

      controls.update()
      renderRef.current(scene, camera, dt)
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    const handleResize = () => {
      if (!container || !camera || !renderer) return
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight)
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [active])

  return { containerRef, scene: sceneRef, camera: cameraRef }
}
