import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { animate, remove } from 'animejs'

function Node({ node, isActive, isCurrent, isHint, onPointerDown, onPointerUp }) {
  const groupRef = useRef(null)
  const stateRef = useRef({ scale: isActive ? 1.25 : 1, emissive: isActive ? 1.1 : 0.35 })
  const [emissiveIntensity, setEmissiveIntensity] = useState(stateRef.current.emissive)

  useEffect(() => {
    remove(stateRef.current)
    animate(stateRef.current, {
      scale: isActive ? 1.24 : 1,
      emissive: isActive ? 1.25 : 0.35,
      duration: 300,
      ease: 'outQuad',
      update: () => setEmissiveIntensity(stateRef.current.emissive),
    })

    return () => remove(stateRef.current)
  }, [isActive])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const pulse = isCurrent ? 1 + Math.sin(performance.now() * 0.01) * 0.06 : 1
    const targetScale = stateRef.current.scale * pulse
    groupRef.current.scale.x += (targetScale - groupRef.current.scale.x) * Math.min(1, delta * 10)
    groupRef.current.scale.y += (targetScale - groupRef.current.scale.y) * Math.min(1, delta * 10)
    groupRef.current.scale.z += (targetScale - groupRef.current.scale.z) * Math.min(1, delta * 10)
  })

  return (
    <group position={node.position} ref={groupRef}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation()
          onPointerDown(node.id)
        }}
        onPointerUp={(event) => {
          event.stopPropagation()
          onPointerUp(node.id)
        }}
      >
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color={isHint ? '#00f6ff' : isActive ? '#39ff9e' : '#9e3dff'}
          emissive={isHint ? '#00f6ff' : isActive ? '#20ff8f' : '#6328a6'}
          emissiveIntensity={isHint ? 1.6 : emissiveIntensity}
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshBasicMaterial color={isCurrent ? '#00f6ff' : '#7d3bf2'} transparent opacity={isCurrent ? 0.3 : 0.15} />
      </mesh>
    </group>
  )
}

export default Node

