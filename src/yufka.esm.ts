import {
  Node,
  Options as AcornOptions,
  parse as acornDefaultParse,
  Parser
} from 'acorn'
import MagicString, { SourceMap, SourceMapOptions } from 'magic-string'
import { collectTreeMetadata, createResult, handleNode } from './lib/lifecycle'
import * as helpers from './lib/helpers'
import { nodeMetadataStore } from './lib/metadata'
import { isPromise, Maybe } from './lib/util'

/**
 * Options passable to Yufka
 */
export interface Options {
  parser?: typeof Parser
  acorn?: AcornOptions
  sourceMap?: SourceMapOptions
}

/**
 * Get the source code of the current node
 */
declare function SourceHelper(): string

/**
 * Get the source code of the provided node
 *
 * @param node The node whose source code to get
 */
declare function SourceHelper(node: Node): string

/**
 * Get the parent node of the current node
 *
 * @param levels The number of ancestor levels to climb
 */
declare function ParentHelper(levels?: number): Maybe<Node>

/**
 * Get the parent node of the provided node
 *
 * @param node   The node whose parent node to get
 * @param levels The number of ancestor levels to climb
 */
declare function ParentHelper(node: Node, levels?: number): Maybe<Node>

/**
 * Replace the current node
 *
 * @param replacement The code to put in place of the current node
 */
declare function UpdateHelper(replacement: string): void

/**
 * Replace the provided node
 *
 * @param node        The node to replace
 * @param replacement The code to put in place of the provided node
 */
declare function UpdateHelper(node: Node, replacement: string): void

/**
 * Tools to handle AST nodes
 */
export interface ManipulationHelpers {
  source: typeof SourceHelper
  parent: typeof ParentHelper
  update: typeof UpdateHelper
}

/**
 * A manipulator function which can be passed into the yufka() function
 */
export type Manipulator<T> = (node: Node, tools: ManipulationHelpers) => T

/**
 * An object representing a running yufka() call by its MagicString
 * instance, its options and its manipulator function
 */
export interface Context<T> {
  magicString: MagicString
  options: Options
  manipulator: Manipulator<T>
}

/**
 * The result of a synchronous yufka() call
 */
export interface SyncResult {
  readonly code: string
  readonly map: SourceMap
}

/**
 * The result of an asynchronous yufka() call
 */
export type AsyncResult = Promise<SyncResult>

/**
 * The synchronous or asynchronous result of a yufka() call,
 * dependending on its generic type variable
 */
export type Result<T> = T extends Promise<void> ? AsyncResult : SyncResult

/**
 * Transform the AST of some JavaScript source code
 *
 * @param source      The source code to transform
 * @param manipulator A callback which is executed for each encountered AST node
 */
function yufka<T>(
  source: string | Buffer,
  manipulator: Manipulator<T>
): Result<T>

/**
 * Transform the AST of some JavaScript source code
 *
 * @param source      The source code to transform
 * @param options     Options to provide to the acorn parser
 * @param manipulator A callback which is executed for each encountered AST node
 */
function yufka<T>(
  source: string | Buffer,
  options: Options,
  manipulator: Manipulator<T>
): Result<T>

function yufka<T>(...yufkaArgs: any[]): any {
  let options: Options
  let manipulator: Manipulator<T>

  // Source is always the first argument
  // Coerce to string in case it's a Buffer object
  const source: string = String(yufkaArgs[0])

  if (typeof yufkaArgs[1] === 'function') {
    // If second argument is a function, options have been omitted
    options = {}
    manipulator = yufkaArgs[1]
  } else if (
    typeof yufkaArgs[1] === 'object' &&
    typeof yufkaArgs[2] === 'function'
  ) {
    // Type check for clarity in case of error
    options = yufkaArgs[1]
    manipulator = yufkaArgs[2]
  } else {
    // Invalid arguments, inform the user comprehensibly
    throw new Error(
      'Invalid arguments. After the source code argument, yufka() expects either an options object and a manipulator function or just a manipulator function'
    )
  }

  const acornOptions: acorn.Options = {
    ecmaVersion: 'latest',
    ...(options.acorn ?? {})
  }

  // Use `parser` option as parser if available
  const rootNode = options.parser
    ? options.parser.parse(source, acornOptions)
    : acornDefaultParse(source, acornOptions)

  // Create the resource all manipulations are performed on
  const magicString = new MagicString(source)

  // Create a context object that can be passed to helpers
  const context = { magicString, options, manipulator }

  // Preparation: collect metadata of the whole AST
  // Allows to modify nodes that have not been visited yet
  nodeMetadataStore.set(rootNode, { parent: undefined, context })

  collectTreeMetadata(rootNode, context)

  // Start the recursive walk
  const walkResult = handleNode(rootNode, context)

  // Create the result
  if (isPromise(walkResult)) {
    return walkResult.then(() => createResult(context))
  } else {
    return createResult(context)
  }
}

yufka.source = helpers.source
yufka.parent = helpers.parent
yufka.update = helpers.update

export default yufka
