import { buildLevelIndex, canConnectNodes } from './puzzleLogic'

const randFromSeed = (seed) => {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

const shuffleWithRandom = (arr, random) => {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const generateNodePositions = (count, random) => {
  const nodes = []
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + random() * 0.35
    const radius = 2.6 + random() * 1.2
    nodes.push({
      id: i + 1,
      type: 'normal',
      position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
    })
  }
  return nodes
}

const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)

const isLevelSolvable = (level) => {
  const levelIndex = buildLevelIndex(level)
  const total = level.nodes.length
  const allIds = level.nodes.map((n) => n.id)

  const dfs = (pathNodes, pathEdges) => {
    if (pathNodes.length === total) return true
    const from = pathNodes[pathNodes.length - 1]

    for (const candidate of allIds) {
      if (pathNodes.includes(candidate)) continue
      const legal = canConnectNodes({
        from,
        to: candidate,
        levelIndex,
        pathEdges,
        pathNodes,
      })
      if (!legal.ok) continue

      const nextNodes = [...pathNodes, candidate]
      const nextEdges = [...pathEdges, [from, candidate]]
      if (dfs(nextNodes, nextEdges)) return true
    }

    return false
  }

  for (const start of allIds) {
    if (dfs([start], [])) return true
  }

  return false
}

export const generateProceduralLevel = ({ id, seed = Date.now(), nodeCount = 7 }) => {
  const random = randFromSeed(seed)

  for (let attempt = 0; attempt < 22; attempt += 1) {
    const nodes = generateNodePositions(nodeCount, random)
    const solution = shuffleWithRandom(nodes.map((n) => n.id), random)

    const edges = new Set()
    for (let i = 0; i < solution.length - 1; i += 1) {
      edges.add(edgeKey(solution[i], solution[i + 1]))
    }

    const extraEdgesTarget = Math.floor(nodeCount * 1.5)
    while (edges.size < solution.length - 1 + extraEdgesTarget) {
      const a = 1 + Math.floor(random() * nodeCount)
      const b = 1 + Math.floor(random() * nodeCount)
      if (a === b) continue
      edges.add(edgeKey(a, b))
    }

    const connections = [...edges].map((entry) => entry.split('-').map(Number))
    const level = {
      id,
      codeName: `PROC NET #${id}`,
      difficulty: 'Procedural',
      tutorial: 'Generated puzzle. No node reuse, no line crossing.',
      rules: {
        maxTimeForS: 32,
        maxTimeForA: 50,
        maxTimeForB: 72,
      },
      nodes,
      connections,
      solutionPath: solution,
    }

    if (isLevelSolvable(level)) {
      return level
    }
  }

  return null
}
