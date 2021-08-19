import type { Node } from 'acorn'

/**
 * Utilities that are completely independent of how Yufka works
 */

/**
 * Union any type with `undefined`
 */
export type Maybe<T> = T | undefined

/**
 * Check whether a variable is a Promise
 *
 * @param value The value to check
 */
export function isPromise<T = any>(value: any): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  )
}

/**
 * Check whether a value resembles an acorn AST node
 *
 * @param value The value to check
 */
export function isNode(value: any): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.type === 'string'
  )
}
