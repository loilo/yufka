/**
 * A set of functions that represent different tasks
 * in the lifecycle of a yufka() call
 */

import { Node } from 'acorn'
import { Context, SyncResult } from '../yufka.esm'
import { NodeMetadata, nodeMetadataStore } from './metadata'
import { isNode, isPromise, Maybe } from './util'

/**
 * Generate metadata for a node
 *
 * @param node    The node to generate metadata for
 * @param parent  The parent of the `node`
 * @param context The yufka() context
 */
export function generateNodeMetadata<T>(
  node: Node,
  parent: Maybe<Node>,
  { magicString }: Context<T>
): NodeMetadata {
  const nodeMetadata = {
    parent(levels: number = 1) {
      // No matter how many levels to climb, no parent means undefined
      if (!parent) {
        return undefined
      }

      // No levels to go up, return current parent
      if (levels <= 1) {
        return parent
      }

      // Recursively get parent node when levels are remaining
      return nodeMetadataStore.get(parent)!.parent(levels - 1)
    },
    source() {
      return magicString.slice(node.start, node.end).toString()
    },
    update(replacement: string) {
      magicString.overwrite(node.start, node.end, replacement)
    }
  }

  return nodeMetadata
}

/**
 * Collect the child AST nodes of a node
 *
 * @param node The node to search for child nodes
 */
export function getChildNodes(node: Node) {
  const childNodes: Node[] = []

  // Walk all AST node properties, performing a recursive `walk`
  // on everything that looks like another AST node
  for (const key of Object.keys(node)) {
    // Explicitely widen the types here since not all
    // properties are represented in acorn's typings
    const property = node[key as keyof Node] as any

    if (Array.isArray(property)) {
      // Step into arrays and walk their items
      for (const propertyElement of property) {
        if (isNode(propertyElement)) {
          childNodes.push(propertyElement)
        }
      }
    } else if (isNode(property)) {
      childNodes.push(property)
    }
  }

  return childNodes
}

/**
 * Perform node handling on child nodes in succession
 * This function returns a promise if any of the executed manipulators
 * returns a promise, otherwise it executes synchronously
 *
 * @param node       The node whose child nodes to handle
 * @param childNodes The child nodes to handle
 */
export function performSuccessiveRecursiveWalks<T>(
  node: Node,
  childNodes: Node[],
  context: Context<T>
): T {
  // Return synchronously when no subwalks are scheduled
  if (childNodes.length === 0) {
    return undefined as any
  }

  const [firstChild, ...remainingChildNodes] = childNodes

  const subwalkResult = handleNode(firstChild, context)

  // When node handling returns a promise, an asynchronous manipulator was called
  // -> wait for it to resolve, then handle next step
  if (isPromise(subwalkResult)) {
    return subwalkResult.then(() =>
      performSuccessiveRecursiveWalks(node, remainingChildNodes, context)
    ) as any
  } else {
    return performSuccessiveRecursiveWalks(node, remainingChildNodes, context)
  }
}

/**
 * Collect metadata of a tree
 *
 * @param node    The starting node of the tree
 * @param context The yufka() context
 */
export function collectTreeMetadata<T>(node: Node, context: Context<T>) {
  const childNodes = getChildNodes(node)

  for (const childNode of childNodes) {
    nodeMetadataStore.set(
      childNode,
      generateNodeMetadata(childNode, node, context)
    )

    collectTreeMetadata(childNode, context)
  }
}

/**
 * Walk the AST under the given node and update its descendants
 *
 * @param node    The AST node to start at
 * @param context The yufka() context
 */
export function handleNode<T>(node: Node, context: Context<T>) {
  // Store meta information for node
  const nodeMetadata = nodeMetadataStore.get(node)!

  // Get subwalks to perform
  const childNodes = getChildNodes(node)
  const subwalksResult = performSuccessiveRecursiveWalks(
    node,
    childNodes,
    context
  )

  // This flag ensures that any of the NodeMetadata methods throws an error
  // when called after the manipulator has finished (e.g. through setTimeout())
  let manipulatorFinished = false

  /**
   * Create a function that handles any of the NodeMetadata methods,
   * taking into account a node as an optional first parameter.
   *
   * @param key The NodeMetadata method to invoke
   */
  function createMetadataMethodHandler<
    U extends 'source' | 'parent' | 'update'
  >(key: U) {
    return (...args: any[]) => {
      if (manipulatorFinished) {
        throw new Error(
          `Cannot run ${key}() after manipulator callback has finished running`
        )
      }

      if (isNode(args[0])) {
        // If first argument is not a node, grab its metadata from
        // the store and execute the according method on that
        const [targetNode, ...remaining] = args
        const method = nodeMetadataStore.get(targetNode)![key] as any
        return method(...remaining)
      } else {
        // If first argument is not a node, execute the
        // according method on the current node metadata
        const method = nodeMetadata[key] as any
        return method(...args)
      }
    }
  }

  // Create the manipulation helpers object
  const helpers = {
    source: createMetadataMethodHandler('source'),
    parent: createMetadataMethodHandler('parent'),
    update: createMetadataMethodHandler('update')
  }

  // Call manipulator function on AST node
  if (isPromise(subwalksResult)) {
    return subwalksResult
      .then(() => {
        return context.manipulator(node, helpers)
      })
      .then(manipulatorResult => {
        manipulatorFinished = true
        return manipulatorResult
      })
  } else {
    const manipulatorResult = context.manipulator(node, helpers)

    if (isPromise(manipulatorResult)) {
      return manipulatorResult.then(result => {
        manipulatorFinished = true
        return result
      })
    } else {
      manipulatorFinished = true
      return manipulatorResult
    }
  }
}

/**
 * Create an immutable yufka() result
 *
 * @param context The yufka() context
 */
export function createResult<T>({
  magicString,
  options
}: Context<T>): SyncResult {
  const code = magicString.toString()

  return Object.freeze({
    code,
    map: magicString.generateMap(options.sourceMap),
    toString() {
      return code
    }
  })
}
