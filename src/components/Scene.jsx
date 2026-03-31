import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, OrbitControls, Stars } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import Node from './Node'
import Connection from './Connection'

function FloatingRig({ children }) {
  const groupRef = useRef(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.13
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.22) * 0.03
  })

  return <group ref={groupRef}>{children}</group>
}

function SceneInner() {
  const { level, pathNodes, pathEdges, pointerDownNode, pointerUpNode, cancelDrag, selectedNode } = useGameStore()

  const nodeMap = useMemo(() => new Map(level.nodes.map((node) => [node.id, node])), [level])

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 5, 4]} intensity={25} color="#00f6ff" />
      <pointLight position={[-5, -2, 4]} intensity={18} color="#5f2eff" />

      <Stars radius={80} depth={26} count={1200} factor={4} fade speed={0.5} />
      <Grid args={[30, 30]} position={[0, -4, 0]} cellColor="#2b2b45" sectionColor="#35356b" infiniteGrid fadeDistance={60} fadeStrength={1} />

      <FloatingRig>
        {pathEdges.map(([from, to]) => {
          const start = nodeMap.get(from)?.position
          const end = nodeMap.get(to)?.position
          if (!start || !end) return null
          return <Connection key={`${from}-${to}`} start={start} end={end} active />
        })}

        {level.nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            isActive={pathNodes.includes(node.id)}
            isCurrent={selectedNode === node.id}
            onPointerDown={pointerDownNode}
            onPointerUp={pointerUpNode}
          />
        ))}
      </FloatingRig>

      <OrbitControls
        enablePan={false}
        enableRotate={false}
        minDistance={6}
        maxDistance={12}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 2.4}
        onEnd={cancelDrag}
      />
    </>
  )
}

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 8.5], fov: 50 }}>
      <color attach="background" args={['#03040a']} />
      <SceneInner />
    </Canvas>
  )
}

export default Scene

