/**
 * The AST nodes' metadata store
 */

import type { Context } from '../yufka.esm'
import type { Node } from 'acorn'
import type { Maybe } from './util'

// This set ensures that any of the NodeMetadata methods throws an error
// when called after its manipulator has finished (e.g. through setTimeout())
export const finishedNodes = new WeakSet<Node>()

/**
 * Ensure that a node has not been handled yet
 *
 * @param node The AST node to check
 *
 */
export function checkNode(node: Node) {
  if (finishedNodes.has(node)) {
    throw new Error(
      `Cannot run helper method after manipulator callback of iterated or target node has finished running`
    )
  }
}

/**
 * Metadata associated with an AST node
 */
export interface NodeMetadata {
  parent: Maybe<Node>

  // We can use `any` as the generic type because it is not relevant to metadata usage
  context: Context<any>
}

/**
 * A place to store meta data associated with encountered AST nodes
 */
export const nodeMetadataStore = new WeakMap<Node, NodeMetadata>()
