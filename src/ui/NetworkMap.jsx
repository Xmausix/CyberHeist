import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls, Stars, Text } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

function MapNode({ level, index, unlocked, best, onSelect }) {
  const ref = useRef(null)
  const x = -4 + index * 2.1
  const y = Math.sin(index * 0.9) * 1.2

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = y + Math.sin(state.clock.elapsedTime * 1.4 + index) * 0.08
  })

  return (
    <group ref={ref} position={[x, y, 0]}>
      <mesh onClick={() => unlocked && onSelect(level.id)}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial
          color={unlocked ? '#00f6ff' : '#4d3560'}
          emissive={unlocked ? '#26ffd9' : '#23122f'}
          emissiveIntensity={unlocked ? 1 : 0.35}
        />
      </mesh>
      <Text position={[0, -0.7, 0]} fontSize={0.18} color={unlocked ? '#9dfdff' : '#7a678a'} anchorX="center" anchorY="middle">
        {level.id}
      </Text>
      {best && (
        <Text position={[0, 0.65, 0]} fontSize={0.15} color="#45ffb0" anchorX="center" anchorY="middle">
          {best.grade}
        </Text>
      )}
    </group>
  )
}

function NetworkMapScene() {
  const unlocked = useGameStore((state) => state.unlockedLevelIds)
  const bestResults = useGameStore((state) => state.bestResults)
  const selectLevel = useGameStore((state) => state.selectLevel)
  const createProceduralLevel = useGameStore((state) => state.createProceduralLevel)
  const levels = useGameStore((state) => state.getAvailableLevels())

  const points = useMemo(() => levels.map((_, index) => [-4 + index * 2.1, Math.sin(index * 0.9) * 1.2, -0.2]), [levels])

  return (
    <div className="overlay network-map-overlay">
      <div className="network-map-header">
        <h2>NETWORK MAP</h2>
        <p>Click unlocked nodes to breach their subnet.</p>
        <button onClick={createProceduralLevel}>GENERATE PROCEDURAL LEVEL</button>
      </div>

      <div className="network-map-canvas">
        <Canvas camera={{ position: [0, 0, 8.5], fov: 48 }}>
          <color attach="background" args={['#02050d']} />
          <ambientLight intensity={0.35} />
          <pointLight position={[0, 4, 4]} intensity={30} color="#00f6ff" />
          <Stars radius={70} depth={20} count={900} factor={3} speed={0.3} />

          {points.length > 1 && <Line points={points} color="#1d8fb0" lineWidth={1.2} transparent opacity={0.65} />}

          {levels.map((level, index) => (
            <MapNode
              key={level.id}
              level={level}
              index={index}
              unlocked={unlocked.includes(level.id)}
              best={bestResults[level.id]}
              onSelect={selectLevel}
            />
          ))}

          <OrbitControls enableRotate={false} enablePan={false} minDistance={7} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  )
}

export default NetworkMapScene
