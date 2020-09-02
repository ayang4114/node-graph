import {
  IMutableWeightedGraph,
  IReadonlyWeightedGraph,
  MutableGraph,
  ReadonlyGraph,
  ValueEdge
} from '../types/GraphSystem'
import { GraphType } from '../types/GraphType'
import { AbstractGraph } from './AbstractGraph'

export class MutableUnweightedGraph<V, E=null>
  extends AbstractGraph<V, E>
  implements MutableGraph<V, E> {
  protected madeReadonly: boolean

  constructor (
    isUndirected: boolean,
    isUnweighted: boolean,
    keyFn?: (v: V) => string
  ) {
    super([], [], isUndirected, isUnweighted, keyFn)
    this.madeReadonly = false
  }

  getGraphType (): GraphType {
    if (this.isUnweighted && this.isUndirected) {
      return this.madeReadonly ? GraphType.ReadonlyNonWeightedUndirected : GraphType.NonWeightedUndirected
    } else if (this.isUndirected) {
      return this.madeReadonly ? GraphType.WeightedUndirected : GraphType.WeightedUndirected
    } else if (this.isUnweighted) {
      return this.madeReadonly ? GraphType.ReadonlyNonWeightedDirected : GraphType.NonWeightedDirected
    } else {
      return this.madeReadonly ? GraphType.ReadonlyWeightedDirected : GraphType.WeightedDirected
    }
  }

  connect (source: V, target: V, value?: any): boolean {
    if (!this.contains(source, target)) { return false }
    if (this.isUnweighted) { value = null }
    const prev = this.sourceToTarget.getValue(source).setValue(target, value)
    this.targetToSource.getValue(target).setValue(source, value)
    if (this.isUndirected) {
      this.sourceToTarget.getValue(target).setValue(source, value)
      this.targetToSource.getValue(source).setValue(target, value)
    }
    return prev == null || prev !== value
  }

  disconnect (source: V, target: V, value?: any): boolean {
    if (!this.contains(source, target)) return false
    const c = this.sourceToTarget.getValue(source).getValue(target)
    if (this.isUnweighted || value == null || value === c) {
      this.sourceToTarget.getValue(source).remove(target)
      this.targetToSource.getValue(target).remove(source)
      if (this.isUndirected) {
        this.targetToSource.getValue(source).remove(target)
        this.sourceToTarget.getValue(target).remove(source)
      }
      return true
    }
    return false
  }

  insert (...nodes: V[]): number {
    let count = 0
    for (const n of nodes) {
      if (typeof n === 'undefined') {
        // undefined as its own type cannot be added to this Set structure.
        count += this.allNodes.add(this.toKeyFn(n) as any) ? 1 : 0
      } else {
        count += this.allNodes.add(n) ? 1 : 0
      }
    }
    return count
  }

  remove (...nodes: V[]): number {
    let count = 0
    for (const n of nodes) {
      if (this.allNodes.contains(n)) {
        this.targetToSource.getValue(n).forEach(s => {
          this.sourceToTarget.getValue(s).remove(n)
        })
        this.sourceToTarget.getValue(n).forEach(t => {
          this.targetToSource.getValue(t).remove(n)
        })
        this.targetToSource.remove(n)
        this.sourceToTarget.remove(n)
        this.allNodes.remove(n)
        count++
      }
    }
    return count
  }

  makeReadonly (): ReadonlyGraph<V, E> {
    this.madeReadonly = true
    return this
  }
}

export class MutableWeightedGraph<V, E>
  extends MutableUnweightedGraph<V, E>
  implements IMutableWeightedGraph<V, E> {
  constructor (
    isUndirected: boolean,
    keyFn?: (v: V) => string
  ) {
    super(isUndirected, false, keyFn)
    this.madeReadonly = false
  }

  weightOf (source: V, target: V): E | undefined {
    const value = this.sourceToTarget.getValue(source).getValue(target)
    return value !== null ? value : undefined
  }

  edges (): ValueEdge<V, E>[] {
    return super.edges().map(e => {
      return { ...e, value: e.value as E }
    })
  }

  incomingEdgesOf (target: V): ValueEdge<V, E>[] {
    return super.incomingEdgesOf(target).map(e => {
      return { ...e, value: e.value as E }
    })
  }

  outgoingEdgesOf (source: V): ValueEdge<V, E>[] {
    return super.outgoingEdgesOf(source).map(e => {
      return { ...e, value: e.value as E }
    })
  }

  hasEdge (source: V, target: V, value?: E): boolean {
    return super.hasEdge(source, target, value)
  }

  connect (source: V, target: V, value: E): boolean {
    return super.connect(source, target, value)
  }

  disconnect (source: V, target: V, value?: E): boolean {
    return super.disconnect(source, target, value)
  }

  getEdgeValue (source: V, target: V): E | undefined {
    return this.weightOf(source, target)
  }

  makeReadonly (): IReadonlyWeightedGraph<V, E> {
    this.madeReadonly = true
    return this
  }
}
