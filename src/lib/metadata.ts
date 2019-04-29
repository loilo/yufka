/**
 * The AST nodes' metadata store
 */

import { Node } from 'acorn'
import { Maybe } from './util'

/**
 * Metadata associated with an AST node
 */
export interface NodeMetadata {
  parent: (levels?: number) => Maybe<Node>
  source: () => string
  update: (replacement: string) => void
}

/**
 * A place to store meta data associated with encountered AST nodes
 */
export const nodeMetadataStore = new WeakMap<Node, NodeMetadata>()
