const EPS = 1e-5

const normalizeEdge = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)

const pointFromNode = (node) => ({ x: node.position[0], y: node.position[1] })

const orientation = (a, b, c) => {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (Math.abs(value) < EPS) {
    return 0
  }
  return value > 0 ? 1 : 2
}

const onSegment = (a, b, c) => {
  return (
    Math.min(a.x, c.x) - EPS <= b.x &&
    b.x <= Math.max(a.x, c.x) + EPS &&
    Math.min(a.y, c.y) - EPS <= b.y &&
    b.y <= Math.max(a.y, c.y) + EPS
  )
}

const segmentsIntersect = (p1, q1, p2, q2) => {
  const o1 = orientation(p1, q1, p2)
  const o2 = orientation(p1, q1, q2)
  const o3 = orientation(p2, q2, p1)
  const o4 = orientation(p2, q2, q1)

  if (o1 !== o2 && o3 !== o4) {
    return true
  }

  if (o1 === 0 && onSegment(p1, p2, q1)) return true
  if (o2 === 0 && onSegment(p1, q2, q1)) return true
  if (o3 === 0 && onSegment(p2, p1, q2)) return true
  if (o4 === 0 && onSegment(p2, q1, q2)) return true

  return false
}

export const buildLevelIndex = (level) => {
  const nodeById = new Map(level.nodes.map((node) => [node.id, node]))
  const blocked = new Set((level.blockedConnections || []).map(([a, b]) => normalizeEdge(a, b)))

  const allowed = new Set(
    level.connections
      .filter(([a, b]) => !blocked.has(normalizeEdge(a, b)))
      .map(([a, b]) => normalizeEdge(a, b)),
  )

  return { nodeById, allowed, blocked }
}

export const canConnectNodes = ({ from, to, levelIndex, pathEdges, pathNodes }) => {
  if (!from || !to || from === to) {
    return { ok: false, reason: 'invalid-node' }
  }

  if (pathNodes.includes(to)) {
    return { ok: false, reason: 'node-reused' }
  }

  const edgeKey = normalizeEdge(from, to)
  if (!levelIndex.allowed.has(edgeKey)) {
    return { ok: false, reason: 'connection-blocked' }
  }

  const fromNode = levelIndex.nodeById.get(from)
  const toNode = levelIndex.nodeById.get(to)
  const p1 = pointFromNode(fromNode)
  const q1 = pointFromNode(toNode)

  for (const [edgeA, edgeB] of pathEdges) {
    if (edgeA === from || edgeA === to || edgeB === from || edgeB === to) {
      continue
    }

    const n1 = levelIndex.nodeById.get(edgeA)
    const n2 = levelIndex.nodeById.get(edgeB)
    if (!n1 || !n2) {
      continue
    }

    const p2 = pointFromNode(n1)
    const q2 = pointFromNode(n2)

    if (segmentsIntersect(p1, q1, p2, q2)) {
      return { ok: false, reason: 'line-intersection' }
    }
  }

  return { ok: true, reason: null }
}

export const hasWonLevel = (pathNodes, totalNodes) => pathNodes.length === totalNodes

export const getProgressPercent = (pathNodes, totalNodes) => {
  if (!totalNodes) {
    return 0
  }
  return Math.min(100, Math.round((pathNodes.length / totalNodes) * 100))
}

export const edgeToKey = normalizeEdge

export const getHintNode = (level, pathNodes) => {
  const solution = level.solutionPath || []
  if (!solution.length) return null

  if (!pathNodes.length) {
    return solution[0]
  }

  const prefixMatches = pathNodes.every((nodeId, index) => solution[index] === nodeId)
  if (!prefixMatches) {
    return solution[0]
  }

  return solution[pathNodes.length] || null
}

export const getScoreSummary = ({ elapsedMs, errors, level }) => {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const penalty = errors * 4
  const effectiveTime = seconds + penalty
  const rules = level.rules || {}

  let grade = 'C'
  if (effectiveTime <= (rules.maxTimeForS ?? 20)) grade = 'S'
  else if (effectiveTime <= (rules.maxTimeForA ?? 35)) grade = 'A'
  else if (effectiveTime <= (rules.maxTimeForB ?? 55)) grade = 'B'

  const score = Math.max(0, 1600 - effectiveTime * 20)
  return { seconds, effectiveTime, grade, score }
}

