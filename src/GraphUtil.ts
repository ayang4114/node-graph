import { GraphInterface } from './GraphInterface'
import { Set } from 'typescript-collections'
import { GraphType } from './GraphType'

const startSymbol = Symbol('start')

const hasCycleInUndirectedGraph = <V> (graph: GraphInterface<V>): boolean => {
  const toKeyFn = graph.toKeyFn
  // If in the set, then the node has been visited
  const visited = new Set<V>(toKeyFn)

  const nodes = graph.nodes().toArray()
  const stack: {node: V, parent: V | symbol}[] = []
  for (const node of nodes) {
    stack.length = 0
    if (!visited.contains(node)) {
      stack.push({ node, parent: startSymbol })
    }
    while (stack.length > 0) {
      const { node: n, parent } = stack.pop()!
      if (!visited.contains(n)) {
        visited.add(n)
        const outgoing = graph.outgoingEdgesOf(n)
        for (const edge of outgoing) {
          if (!visited.contains(edge.target) || parent === startSymbol) {
            stack.push({ node: edge.target, parent: n })
          } else {
            return true
          }
        }
      }
    }
  }
  return false
}

const hasCycleInDirectedGraph = <V> (graph: GraphInterface<V>): boolean => {
  const visited = new Set<V>(graph.toKeyFn)
  const nodesOnStack = new Set<V>(graph.toKeyFn)
  const recursionStack: V[] = []
  const nodes = graph.nodes().toArray()

  function findCycle (node: V): boolean {
    if (visited.contains(node)) {
      return false
    }
    if (nodesOnStack.contains(node)) {
      return true
    } else {
      const outgoingEdges = graph.outgoingEdgesOf(node)
      recursionStack.push(node)
      nodesOnStack.add(node)
      for (const edge of outgoingEdges) {
        if (findCycle(edge.target)) return true
      }
      visited.add(node)
      nodesOnStack.remove(node)
      recursionStack.pop()
    }
    return false
  }

  for (const node of nodes) {
    recursionStack.length = 0
    if (findCycle(node)) return true
  }
  return false
}

export const hasCycle = <V> (graph: GraphInterface<V>): boolean => {
  const graphType = graph.getGraphType()
  switch (graphType) {
    case GraphType.NonValueDirected:
    case GraphType.ValueDirected:
      return hasCycleInDirectedGraph(graph)
    case GraphType.NonValueUndirected:
    case GraphType.ValueUndirected:
      return hasCycleInDirectedGraph(graph)
  }
}
