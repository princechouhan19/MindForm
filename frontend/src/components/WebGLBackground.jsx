import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * WebGL Background — animated particle field + subtle gradient mesh
 * using raw Three.js (no @react-three/fiber dependency)
 */
export default function WebGLBackground({ theme = 'dark' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Renderer ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight)

    // ── Scene & Camera ─────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 50

    // ── Particle System ───────────────────────────────────
    const COUNT = 1400
    const positions = new Float32Array(COUNT * 3)
    const colors    = new Float32Array(COUNT * 3)
    const sizes     = new Float32Array(COUNT)
    const speeds    = new Float32Array(COUNT)

    // Brand colours: gold, indigo, terra-cotta — no neon
    const palette = theme === 'light'
      ? [
          new THREE.Color('#b8864a'),
          new THREE.Color('#6355ba'),
          new THREE.Color('#c0573a'),
          new THREE.Color('#3d8a6f'),
        ]
      : [
          new THREE.Color('#c9a96e'),
          new THREE.Color('#7b68d4'),
          new THREE.Color('#e07b54'),
          new THREE.Color('#5ba88f'),
        ]

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      // Spread across sphere
      const r   = 55 + Math.random() * 45
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      positions[i3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i3]     = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b

      sizes[i]  = Math.random() * 1.8 + 0.4
      speeds[i] = (Math.random() - 0.5) * 0.0008
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1))

    const mat = new THREE.PointsMaterial({
      size:        0.35,
      sizeAttenuation: true,
      vertexColors: true,
      transparent:  true,
      opacity:      theme === 'light' ? 0.55 : 0.7,
      blending:     THREE.AdditiveBlending,
      depthWrite:   false,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    // ── Connection Lines (sparse) ─────────────────────────
    const lineMat = new THREE.LineBasicMaterial({
      color: theme === 'light' ? 0xb8864a : 0xc9a96e,
      transparent: true,
      opacity: theme === 'light' ? 0.04 : 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const lineGeo = new THREE.BufferGeometry()
    const linePositions = []
    const CONNECTIONS = 120
    for (let i = 0; i < CONNECTIONS; i++) {
      const a = Math.floor(Math.random() * COUNT) * 3
      const b = Math.floor(Math.random() * COUNT) * 3
      linePositions.push(positions[a], positions[a+1], positions[a+2])
      linePositions.push(positions[b], positions[b+1], positions[b+2])
    }
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3))
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    scene.add(lines)

    // ── Mouse interaction ─────────────────────────────────
    let mouseX = 0, mouseY = 0
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    // ── Resize handler ────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation loop ─────────────────────────────────────
    let raf
    let t = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.0004

      // Slow auto-rotation + mouse parallax
      points.rotation.y = t + mouseX * 0.15
      points.rotation.x = t * 0.4 + mouseY * 0.08
      lines.rotation.y  = points.rotation.y
      lines.rotation.x  = points.rotation.x

      // Pulse opacity
      mat.opacity = (theme === 'light' ? 0.45 : 0.6) + Math.sin(t * 3) * 0.08

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      lineGeo.dispose()
      lineMat.dispose()
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      id="lp-webgl-canvas"
      aria-hidden="true"
    />
  )
}
