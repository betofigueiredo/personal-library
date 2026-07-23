import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A cute, smooth-shaded black tuxedo cat — Gorda. Soft, rounded, chibi
// proportions: a big round head on a chubby little body, short stubby legs and
// a plush curled-up tail. Her tuxedo markings (cream muzzle, chest, paws and
// tail tip) and warm-black coat are kept from the figurine, but everything is
// built from smooth spheres now instead of flat facets, with big glossy amber
// eyes and catchlights so she reads as friendly and expressive.
const FUR = '#2b2226' // warm black with a plum cast so sunset light plays on it
const CREAM = '#eee0c2' // muzzle, chest, cheeks, paws, tail tip
const EYE = '#e0a83e' // amber iris, faintly lit so she has a face at dusk
const PUPIL = '#1c1418' // soft-black pupil
const PINK = '#dda6a1' // button nose and inner ears
const HILITE = '#fff6e8' // eye catchlight

/** Hip positions: [x, z]. Front pair at +z (nose side), back pair at -z. */
const LEGS: [number, number][] = [
  [-0.14, 0.19], // front-left
  [0.14, 0.19], // front-right
  [-0.14, -0.23], // back-left
  [0.14, -0.23], // back-right
]

// Leg-swings per unit of ground speed, per second. Calibrated so the gait
// reads naturally across the Player's walk speed and keeps the paws from
// sliding on the ground.
const STRIDE_CADENCE = 2.2

// Smooth fur — soft and plush rather than shiny.
function Fur({ color = FUR }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={0.85} />
}

/**
 * A cute, smooth-shaded cat built from rounded primitives, animated
 * procedurally. `motion` is a live 0..1 ref (0 = idle, 1 = walking) and `speed`
 * is the live ground speed that drives the gait cadence — both from the Player.
 * The cat faces +Z in local space.
 */
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
      const swaySpeed = m > 0.1 ? 9 : 2.5
      tail.current.rotation.z = Math.sin(t * swaySpeed) * (0.35 + 0.15 * m)
      tail.current.rotation.x = -0.5 + Math.sin(t * swaySpeed * 0.5) * 0.1
    }
  })

  return (
    <group>
      {/* Everything that bobs sits under `body` */}
      <group ref={body}>
        {/* Torso — a chubby, smooth egg, a touch longer than tall. */}
        <mesh castShadow position={[0, 0.29, -0.05]} scale={[0.98, 0.86, 1.2]}>
          <sphereGeometry args={[0.3, 32, 24]} />
          <Fur />
        </mesh>
        {/* Round little haunches for a soft rear end */}
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * 0.13, 0.27, -0.26]} scale={[1, 1.05, 1.05]}>
            <sphereGeometry args={[0.15, 24, 18]} />
            <Fur />
          </mesh>
        ))}
        {/* Neck — bridges chubby shoulders and the base of the round skull */}
        <mesh castShadow position={[0, 0.43, 0.16]} scale={[0.86, 0.9, 0.82]}>
          <sphereGeometry args={[0.17, 24, 18]} />
          <Fur />
        </mesh>
        {/* Cream bib down the chest and throat */}
        <mesh castShadow position={[0, 0.28, 0.21]} scale={[0.64, 1.02, 0.5]}>
          <sphereGeometry args={[0.2, 24, 18]} />
          <Fur color={CREAM} />
        </mesh>

        {/* Head group (front, +z) — big and round for a cute, top-heavy look */}
        <group ref={head} position={[0, 0.54, 0.24]}>
          {/* Round skull */}
          <mesh castShadow scale={[1.06, 1, 0.96]}>
            <sphereGeometry args={[0.27, 32, 24]} />
            <Fur />
          </mesh>
          {/* Cream muzzle filling the lower front of the face */}
          <mesh castShadow position={[0, -0.1, 0.17]} scale={[0.92, 0.72, 0.7]}>
            <sphereGeometry args={[0.16, 24, 18]} />
            <Fur color={CREAM} />
          </mesh>
          {/* Chubby cream cheeks */}
          {[-1, 1].map((s) => (
            <mesh key={s} castShadow position={[s * 0.16, -0.05, 0.09]} scale={[1, 0.92, 0.92]}>
              <sphereGeometry args={[0.11, 20, 16]} />
              <Fur color={CREAM} />
            </mesh>
          ))}
          {/* Little pink button nose */}
          <mesh position={[0, -0.035, 0.28]} scale={[1.3, 0.95, 0.8]}>
            <sphereGeometry args={[0.032, 16, 12]} />
            <meshStandardMaterial color={PINK} roughness={0.6} />
          </mesh>
          {/* Big glossy amber eyes with dark pupils and a bright catchlight */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.12, 0.035, 0.19]}>
              <mesh scale={[1, 1.12, 0.7]}>
                <sphereGeometry args={[0.078, 24, 18]} />
                <meshStandardMaterial
                  color={EYE}
                  emissive="#8a5c18"
                  emissiveIntensity={0.35}
                  roughness={0.18}
                />
              </mesh>
              <mesh position={[0, 0, 0.05]} scale={[0.82, 1.15, 0.6]}>
                <sphereGeometry args={[0.046, 20, 16]} />
                <meshStandardMaterial color={PUPIL} roughness={0.2} />
              </mesh>
              <mesh position={[s * -0.018 + 0.02, 0.04, 0.085]}>
                <sphereGeometry args={[0.02, 12, 10]} />
                <meshStandardMaterial
                  color={HILITE}
                  emissive={HILITE}
                  emissiveIntensity={0.7}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}
          {/* Soft, rounded ears with pink inners */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.15, 0.24, -0.01]} rotation={[0, -s * 0.4, s * 0.22]}>
              <mesh castShadow>
                <coneGeometry args={[0.11, 0.23, 20]} />
                <Fur />
              </mesh>
              <mesh position={[0, -0.01, 0.03]}>
                <coneGeometry args={[0.062, 0.15, 20]} />
                <meshStandardMaterial color={PINK} roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Plush tail — a fluffy curl of soft spheres rising behind her, tipped
          in cream. Pivots at the base so it can sway. */}
      <group ref={tail} position={[0, 0.32, -0.4]}>
        <mesh castShadow position={[0, 0.06, -0.01]}>
          <sphereGeometry args={[0.075, 18, 14]} />
          <Fur />
        </mesh>
        <mesh castShadow position={[0.01, 0.16, -0.02]}>
          <sphereGeometry args={[0.07, 18, 14]} />
          <Fur />
        </mesh>
        <mesh castShadow position={[0.05, 0.25, -0.01]}>
          <sphereGeometry args={[0.065, 18, 14]} />
          <Fur />
        </mesh>
        <mesh castShadow position={[0.11, 0.32, 0.02]}>
          <sphereGeometry args={[0.062, 18, 14]} />
          <Fur />
        </mesh>
        {/* Cream fluffy tip */}
        <mesh castShadow position={[0.17, 0.37, 0.05]} scale={[1.05, 1.1, 1.05]}>
          <sphereGeometry args={[0.062, 18, 14]} />
          <Fur color={CREAM} />
        </mesh>
      </group>

      {/* Short, stubby legs — each pivoting at the hip, with soft cream paws. */}
      {LEGS.map(([x, z], i) => (
        <group
          key={i}
          ref={(el) => {
            legs.current[i] = el
          }}
          position={[x, 0.15, z]}
        >
          <mesh castShadow position={[0, -0.045, 0]}>
            <cylinderGeometry args={[0.075, 0.062, 0.12, 16]} />
            <Fur />
          </mesh>
          {/* Rounded cream paw */}
          <mesh castShadow position={[0, -0.105, 0.012]} scale={[1, 0.8, 1.15]}>
            <sphereGeometry args={[0.062, 18, 14]} />
            <Fur color={CREAM} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
