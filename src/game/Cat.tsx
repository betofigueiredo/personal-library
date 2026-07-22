import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A low-poly black cat in the style of the papercraft figurines: a deep
// warm black coat in fine flat facets, with the figurine's tuxedo markings —
// cream muzzle, chest, paws and tail tip — small amber eyes and pointed ears
// with softer inners. Natural cat proportions rather than chibi — the head
// sits forward on a longer body.
const FUR = '#2b2226' // warm black with a plum cast so sunset light plays on it
const FUR_DARK = '#584a44' // inner ears
const CREAM = '#eee0c2' // muzzle, chest, paws, tail tip
const EYE = '#e0a83e' // amber, faintly lit so she has a face at dusk
const NOSE = '#3a2b26'

/** Hip positions: [x, z]. Front pair at +z (nose side), back pair at -z. */
const LEGS: [number, number][] = [
  [-0.13, 0.2], // front-left
  [0.13, 0.2], // front-right
  [-0.13, -0.22], // back-left
  [0.13, -0.22], // back-right
]

/**
 * A stylized low-poly cat built from faceted primitives, animated
 * procedurally. `motion` is a live 0..1 ref (0 = idle, 1 = walking) driven by
 * the Player. The cat faces +Z in local space.
 */
// Leg-swings per unit of ground speed, per second. Calibrated so the gait
// reads naturally across the Player's walk speed and keeps the paws from
// sliding on the ground.
const STRIDE_CADENCE = 2.2

export function Cat({
  motion,
  speed,
}: {
  motion: RefObject<number>
  speed: RefObject<number>
}) {
  const body = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const legs = useRef<(THREE.Group | null)[]>([])
  const stridePhase = useRef(0) // accumulated gait phase, advanced by speed

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const m = motion.current // 0..1
    const idle = 1 - m

    // Trotting gait: diagonal pairs move together (FL+BR, FR+BL). The stride
    // phase advances with ground speed rather than raw time, so the legs
    // cycle faster the faster the cat travels.
    stridePhase.current += speed.current * STRIDE_CADENCE * delta
    const stride = stridePhase.current
    const amp = 0.6 * m
    const phase = [0, Math.PI, Math.PI, 0] // FL, FR, BL, BR
    for (let i = 0; i < LEGS.length; i++) {
      const leg = legs.current[i]
      if (leg) leg.rotation.x = Math.sin(stride + phase[i]) * amp
    }

    // Body bob + gentle idle breathing.
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(stride)) * 0.05 * m
      const breathe = 1 + Math.sin(t * 2.5) * 0.03 * idle
      body.current.scale.y = breathe
    }

    // Head: bob while walking, curious little tilt when idle.
    if (head.current) {
      head.current.rotation.x = Math.sin(stride) * 0.06 * m
      head.current.rotation.z = Math.sin(t * 0.8) * 0.08 * idle
    }

    // Tail: lively sway while walking, slow flick when idle.
    if (tail.current) {
      const speed = m > 0.1 ? 9 : 2.5
      tail.current.rotation.z = Math.sin(t * speed) * (0.35 + 0.15 * m)
      tail.current.rotation.x = -0.7 + Math.sin(t * speed * 0.5) * 0.1
    }
  })

  return (
    <group>
      {/* Everything that bobs sits under `body` */}
      <group ref={body}>
        {/* Torso — a long faceted pebble, tilted nose-up so the shoulders
            rise toward the neck instead of ending in a ball. Detail 1 with
            flat shading keeps the papercraft look with finer facets. */}
        <mesh
          castShadow
          position={[0, 0.3, -0.05]}
          rotation={[-0.12, 0, 0]}
          scale={[0.85, 0.8, 1.28]}
        >
          <icosahedronGeometry args={[0.27, 1]} />
          <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
        </mesh>
        {/* Haunches over the back hips, tucked well into the torso so they
            blend rather than bolt on */}
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * 0.11, 0.27, -0.24]} scale={[0.95, 1.05, 1.15]}>
            <icosahedronGeometry args={[0.14, 1]} />
            <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
          </mesh>
        ))}
        {/* Neck — bridges the torso's shoulders and the base of the skull so
            head and body read as one continuous form */}
        <mesh castShadow position={[0, 0.45, 0.21]} scale={[0.82, 0.95, 0.78]}>
          <icosahedronGeometry args={[0.17, 1]} />
          <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
        </mesh>
        {/* Cream bib running from the belly up the throat to the chin, like
            the reference figurine */}
        <mesh castShadow position={[0, 0.3, 0.19]} scale={[0.6, 1.05, 0.46]}>
          <icosahedronGeometry args={[0.2, 1]} />
          <meshStandardMaterial color={CREAM} roughness={0.75} flatShading />
        </mesh>

        {/* Head group (front, +z) — natural size, settled onto the neck */}
        <group ref={head} position={[0, 0.56, 0.27]}>
          {/* Faceted wedge of a skull. The X tilt (atan(1/φ²) ≈ 0.365) aligns
              a face center with +z so a flat facet, not a corner, points
              forward. */}
          <mesh castShadow rotation={[0.365, 0, 0]} scale={[1.02, 0.92, 0.88]}>
            <icosahedronGeometry args={[0.24, 1]} />
            <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
          </mesh>
          {/* Cream muzzle and chin filling the lower half of the face */}
          <mesh castShadow position={[0, -0.095, 0.13]} scale={[0.8, 0.58, 0.62]}>
            <icosahedronGeometry args={[0.15, 1]} />
            <meshStandardMaterial color={CREAM} roughness={0.75} flatShading />
          </mesh>
          {/* Small dark nose where fur meets muzzle */}
          <mesh position={[0, -0.045, 0.245]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.024, 0.032, 4]} />
            <meshStandardMaterial color={NOSE} roughness={0.5} flatShading />
          </mesh>
          {/* Small amber eyes, wide-set and slightly embedded in the face —
              a touch of emissive keeps them visible against the black fur */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, 0.035, 0.19]} scale={[1, 1.25, 0.45]}>
              <icosahedronGeometry args={[0.036, 1]} />
              <meshStandardMaterial
                color={EYE}
                emissive="#9a6a1c"
                emissiveIntensity={0.5}
                roughness={0.25}
                flatShading
              />
            </mesh>
          ))}
          {/* Pointed ears with darker inners */}
          <mesh castShadow position={[-0.14, 0.25, -0.03]} rotation={[0, 0.35, -0.22]}>
            <coneGeometry args={[0.1, 0.21, 4]} />
            <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
          </mesh>
          <mesh castShadow position={[0.14, 0.25, -0.03]} rotation={[0, -0.35, 0.22]}>
            <coneGeometry args={[0.1, 0.21, 4]} />
            <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[-0.135, 0.235, -0.005]} rotation={[0, 0.35, -0.22]}>
            <coneGeometry args={[0.058, 0.13, 4]} />
            <meshStandardMaterial color={FUR_DARK} roughness={0.75} flatShading />
          </mesh>
          <mesh position={[0.135, 0.235, -0.005]} rotation={[0, -0.35, 0.22]}>
            <coneGeometry args={[0.058, 0.13, 4]} />
            <meshStandardMaterial color={FUR_DARK} roughness={0.75} flatShading />
          </mesh>
        </group>
      </group>

      {/* Tail — slim and long, carried up in a lazy curve, cream at the tip
          like the figurine. Pivots at the base, behind the body. */}
      <group ref={tail} position={[0, 0.32, -0.38]}>
        <mesh castShadow position={[0, 0.1, -0.03]} rotation={[0.25, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.052, 0.24, 6]} />
          <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[0.03, 0.25, 0.0]} rotation={[-0.35, 0, -0.35]}>
          <cylinderGeometry args={[0.033, 0.042, 0.17, 6]} />
          <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[0.085, 0.32, 0.02]} scale={[1, 1.15, 1]}>
          <icosahedronGeometry args={[0.048, 1]} />
          <meshStandardMaterial color={CREAM} roughness={0.75} flatShading />
        </mesh>
      </group>

      {/* Legs — each pivoting at the hip, with cream paw tips. */}
      {LEGS.map(([x, z], i) => (
        <group
          key={i}
          ref={(el) => {
            legs.current[i] = el
          }}
          position={[x, 0.16, z]}
        >
          <mesh castShadow position={[0, -0.07, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.055, 0.048, 0.15, 6]} />
            <meshStandardMaterial color={FUR} roughness={0.7} flatShading />
          </mesh>
          {/* Cream paw tip */}
          <mesh castShadow position={[0, -0.135, 0.015]} scale={[1, 0.6, 1.15]}>
            <icosahedronGeometry args={[0.052, 1]} />
            <meshStandardMaterial color={CREAM} roughness={0.75} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
