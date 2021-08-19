/**
 * Helper functions for manipulator callbacks
 */

import { Node } from 'acorn'
import type { Maybe } from './util'
import { nodeMetadataStore, checkNode } from './metadata'

/**
 * Get the original source code of a node
 *
 * @param node The AST node to get the source code for
 *
 */
export function source(node: Node) {
  checkNode(node)

  const { context } = nodeMetadataStore.get(node)!

  return context.magicString.slice(node.start, node.end).toString()
}

/**
 * Get a node's parent node
 *
 * @param node   The AST node whose parent to get
 * @param levels The number of levels to go up the AST
 *
 */
export function parent(node: Node, levels: number = 1): Maybe<Node> {
  checkNode(node)

  const { parent: parentNode } = nodeMetadataStore.get(node)!

  // No matter how many levels to climb, no parent means undefined
  if (!parentNode) {
    return undefined
  }

  // No levels to go up, return current parent
  if (levels <= 1) {
    return parentNode
  }

  // Recursively get parent node when levels are remaining
  return parent(parentNode, levels - 1)
}

/**
 * Replace a node's source code
 *
 * @param node        The AST node to replace
 * @param replacement The replacement code
 *
 */
export function update(node: Node, replacement: string) {
  checkNode(node)

  const { context } = nodeMetadataStore.get(node)!

  context.magicString.overwrite(node.start, node.end, replacement)
}
