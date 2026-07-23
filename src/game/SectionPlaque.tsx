import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { stoneTexture, woodTexture } from './textures'
import { makeRng } from './rng'

/**
 * The court's name, carried on a broad pier that caps the front end of the
 * left (shelved) stone wall. The pier is built from the same mossy stone as
 * the wall — so it reads as the wall thickening into a terminal — with a
 * rough, freshly-cloven crown of rock chips, a wooden cap continuing the
 * wall's beam, and a smooth dark wooden name-plate on the face turned toward
 * the approaching cat.
 */

const STONE = '#9b9890' // matches the section's StoneWall
const STONE_CHUNKS = ['#a6a29a', '#918e86', '#8a8880', '#9b9890']
const WOOD_CAP = '#6b4a2e' // matches the wall's wooden cap beam
const WOOD_PANEL = '#33241a' // dark walnut name-plate
const TEXT = '#efe7d7'

const PIER_W = 1.0
const PIER_H = 2.1 // same height as the wall
const PIER_D = 0.55
const PANEL_FRONT = PIER_D / 2 + 0.07 // z of the name-plate's carved face

/** Rough rock chips heaped along the pier's cloven front edge and crown, so
 *  the stone reads as freshly split rather than a clean block. */
function RockChips({ seed }: { seed: number }) {
  const chips = useMemo(() => {
    const rand = makeRng(seed)
    const out: {
      pos: [number, number, number]
      s: [number, number, number]
      rot: [number, number, number]
      c: string
    }[] = []
    const chip = (pos: [number, number, number], base: number) => ({
      pos,
      s: [base, base * (0.7 + rand() * 0.6), base * (0.7 + rand() * 0.5)] as [
        number,
        number,
        number,
      ],
      rot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      c: STONE_CHUNKS[(rand() * STONE_CHUNKS.length) | 0],
    })
    // Down the front-left cloven edge of the pier.
    for (let i = 0; i < 9; i++) {
      const t = i / 8
      out.push(
        chip(
          [-PIER_W / 2 + (rand() - 0.5) * 0.12, 0.3 + t * (PIER_H - 0.4), PIER_D / 2 - rand() * 0.18],
          0.1 + rand() * 0.14,
        ),
      )
    }
    // A broken crown across the top.
    for (let i = 0; i < 6; i++) {
      out.push(
        chip(
          [-PIER_W / 2 + (i / 5) * PIER_W, PIER_H - 0.02 + (rand() - 0.5) * 0.1, (rand() - 0.5) * PIER_D * 0.7],
          0.11 + rand() * 0.13,
        ),
      )
    }
    return out
  }, [seed])

  return (
    <>
      {chips.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot} scale={r.s} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={r.c} roughness={0.96} flatShading />
        </mesh>
      ))}
    </>
  )
}

export function SectionPlaque({
  title,
  subtitle,
  seed = 0,
  position = [-4.2, 0, 1.85],
  rotation = 0.2,
}: {
  title: string
  subtitle?: string
  seed?: number
  position?: [number, number, number]
  rotation?: number
}) {
  const stoneTex = useMemo(() => stoneTexture(0.8, 1.3), [])
  const panelTex = useMemo(() => woodTexture(1, 1), [])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* The stone pier — same stone as the wall, thickened into a terminal */}
      <mesh position={[0, PIER_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[PIER_W, PIER_H, PIER_D]} />
        <meshStandardMaterial map={stoneTex} color={STONE} roughness={0.95} />
      </mesh>
      <RockChips seed={300 + seed} />

      {/* Wooden cap continuing the wall's beam */}
      <mesh position={[0, PIER_H + 0.06, 0]} castShadow>
        <boxGeometry args={[PIER_W + 0.16, 0.13, PIER_D + 0.16]} />
        <meshStandardMaterial color={WOOD_CAP} roughness={0.8} />
      </mesh>

      {/* Smooth dark wooden name-plate on the entrance-facing side */}
      <mesh position={[0, 1.12, PIER_D / 2 + 0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.86, 1.36, 0.12]} />
        <meshStandardMaterial map={panelTex} color={WOOD_PANEL} roughness={0.55} />
      </mesh>
      <Text
        position={[0, 1.5, PANEL_FRONT]}
        fontSize={0.16}
        maxWidth={0.76}
        lineHeight={1.04}
        textAlign="center"
        anchorX="center"
        anchorY="top"
        color={TEXT}
        outlineWidth={0.006}
        outlineColor="#1a120b"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          position={[0, 0.78, PANEL_FRONT]}
          fontSize={0.072}
          maxWidth={0.76}
          lineHeight={1.15}
          textAlign="center"
          anchorX="center"
          anchorY="top"
          color="#cbbfa6"
        >
          {subtitle}
        </Text>
      )}

      {/* Solid collider so the cat bumps the pier */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[PIER_W / 2, PIER_H / 2, PIER_D / 2]} position={[0, PIER_H / 2, 0]} />
      </RigidBody>
    </group>
  )
}
