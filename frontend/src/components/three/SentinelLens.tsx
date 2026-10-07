import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  ShaderMaterial,
} from 'three'

const vertexShader = `
  uniform float time;
  uniform float pixelRatio;
  uniform float focus;
  attribute vec3 clusterPosition;
  attribute float size;
  attribute vec3 tint;
  varying vec3 vColor;
  void main() {
    vColor = tint;
    vec3 p = mix(position, clusterPosition, smoothstep(0.1, 0.75, focus));
    float angle = time * 0.035 + length(p.xy) * 0.05;
    p.xy = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xy;
    p.z += sin(time * 0.4 + p.x * 2.0) * 0.035;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(12.0, size * pixelRatio * (28.0 / -mv.z));
  }
`
const fragmentShader = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = pow(1.0 - d * 2.0, 2.0);
    gl_FragColor = vec4(vColor * 1.6, core * 0.95);
  }
`

function ParticleField({
  running,
  compact,
}: {
  running: boolean
  compact: boolean
}) {
  const material = useRef<ShaderMaterial>(null)
  const data = useMemo(() => {
    let seed = 731
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }
    const count = compact ? 4500 : 9500
    const positions = new Float32Array(count * 3)
    const clusterPositions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const color = new Color()
    for (let i = 0; i < count; i++) {
      const ring = i > count * 0.68
      const theta = rand() * Math.PI * 2
      const radius = ring
        ? 1.96 + (rand() - 0.5) * 0.17
        : Math.pow(rand(), 0.48) * 1.64
      const phi = Math.acos(2 * rand() - 1)
      positions[i * 3] = radius * Math.cos(theta) * (ring ? 1 : Math.sin(phi))
      positions[i * 3 + 1] =
        radius * Math.sin(theta) * (ring ? 1 : Math.sin(phi))
      positions[i * 3 + 2] = ring
        ? (rand() - 0.5) * 0.1
        : radius * Math.cos(phi) * 0.6
      const clusterAngle = ((i % 5) * Math.PI * 2) / 5
      clusterPositions[i * 3] = ring
        ? positions[i * 3]
        : Math.cos(clusterAngle) * 0.9 + positions[i * 3] * 0.27
      clusterPositions[i * 3 + 1] = ring
        ? positions[i * 3 + 1]
        : Math.sin(clusterAngle) * 0.9 + positions[i * 3 + 1] * 0.27
      clusterPositions[i * 3 + 2] = positions[i * 3 + 2] * (ring ? 1 : 0.5)
      const warm = i % 137 === 0
      color.set(
        warm
          ? '#ffc88e'
          : i % 5 === 0
            ? '#efedff'
            : i % 3 === 0
              ? '#bfa3ff'
              : '#7654e8',
      )
      colors.set([color.r, color.g, color.b], i * 3)
      sizes[i] = warm ? 2 : 0.4 + rand() * 0.95
    }
    return { positions, clusterPositions, colors, sizes }
  }, [compact])
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      focus: { value: 0 },
      pixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
    }),
    [],
  )
  useFrame((_, delta) => {
    if (running && material.current) {
      material.current.uniforms.time.value += Math.min(delta, 0.05)
      const focus = material.current.uniforms.focus
      focus.value +=
        (Math.min(window.scrollY / window.innerHeight, 1) - focus.value) *
        Math.min(delta * 4, 1)
    }
  })
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-clusterPosition"
          args={[data.clusterPositions, 3]}
        />
        <bufferAttribute attach="attributes-tint" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

function Lens({ running, compact }: { running: boolean; compact: boolean }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidate()
  }, [running, compact, invalidate])
  const assembly = useRef<Group>(null)
  const dial = useRef<Group>(null)
  const elapsed = useRef(0)
  useFrame(({ pointer }, delta) => {
    if (!running || !assembly.current) return
    const dt = Math.min(delta, 0.05)
    elapsed.current += dt
    const scroll = Math.min(window.scrollY / window.innerHeight, 1)
    assembly.current.rotation.x +=
      (0.32 + pointer.y * 0.1 - assembly.current.rotation.x) * dt * 2
    assembly.current.rotation.y +=
      (-0.45 + pointer.x * 0.14 + scroll * 0.35 - assembly.current.rotation.y) *
      dt *
      2
    assembly.current.rotation.z =
      -0.32 + Math.sin(elapsed.current * 0.12) * 0.04
    assembly.current.position.y = Math.sin(elapsed.current * 0.45) * 0.035
    if (dial.current) dial.current.rotation.z += dt * 0.023
  })
  return (
    <group ref={assembly} rotation={[0.32, -0.45, -0.32]}>
      <ParticleField running={running} compact={compact} />
      {[
        { r: 2.32, t: 0.13, z: -0.2 },
        { r: 2.15, t: 0.065, z: 0.08 },
        { r: 1.82, t: 0.055, z: 0.2 },
      ].map(({ r, t, z }, i) => (
        <group key={r} position={[0, 0, z]}>
          <mesh>
            <torusGeometry args={[r, t, 16, compact ? 120 : 200]} />
            <meshStandardMaterial
              color={i === 0 ? '#25212f' : '#444052'}
              metalness={0.86}
              roughness={0.26}
            />
          </mesh>
          <mesh position={[0, 0, t * 0.65]}>
            <torusGeometry args={[r + t * 0.55, 0.008, 8, 180]} />
            <meshBasicMaterial
              color={i === 0 ? '#af92fa' : '#c0b1fa'}
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0, -0.2]}>
        <ringGeometry args={[2.23, 2.41, 160]} />
        <meshStandardMaterial
          color="#393441"
          metalness={0.8}
          roughness={0.3}
          side={DoubleSide}
        />
      </mesh>
      <group ref={dial} position={[0, 0, -0.07]}>
        {Array.from({ length: 96 }, (_, i) => {
          const a = (i / 96) * Math.PI * 2
          const major = i % 8 === 0
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 2.32, Math.sin(a) * 2.32, 0]}
              rotation={[0, 0, a]}
            >
              <boxGeometry args={[major ? 0.105 : 0.046, 0.009, 0.007]} />
              <meshBasicMaterial color={major ? '#d9cff1' : '#766b91'} />
            </mesh>
          )
        })}
      </group>
      <mesh position={[0, 0, 0.19]} rotation={[0, 0, 0.5]}>
        <torusGeometry args={[1.82, 0.024, 8, 100, 1.8]} />
        <meshBasicMaterial color="#e5d6ff" />
      </mesh>
      <mesh position={[0, 0, -0.3]} rotation={[0, 0, 3.1]}>
        <torusGeometry args={[2.48, 0.008, 6, 130, 4.2]} />
        <meshBasicMaterial color="#746498" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0, -0.25]}>
        <torusGeometry args={[2.08, 0.11, 12, 160]} />
        <meshBasicMaterial
          color="#763afa"
          transparent
          opacity={0.06}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default function SentinelLens({
  running,
  compact,
}: {
  running: boolean
  compact: boolean
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8.6], fov: 40 }}
      dpr={[1, 1.5]}
      frameloop={running ? 'always' : 'demand'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[-3, 4, 5]} intensity={4} color="#e1d5ff" />
      <pointLight position={[3, -2, 3]} intensity={35} color="#8455ff" />
      <pointLight position={[-3, -3, 0]} intensity={15} color="#4871ea" />
      <Lens running={running} compact={compact} />
    </Canvas>
  )
}
