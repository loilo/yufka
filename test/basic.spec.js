const yufka = require('../dist/cjs/yufka.common')

it('should pass the base test', () => {
  const { src, validate } = require('./.base-test')(3)

  const output = yufka(src, (node, { update, source }) => {
    if (node.type === 'ArrayExpression') {
      update(`fn(${source()})`)
    }
  })

  expect(typeof output).toBe('object')
  expect(output).not.toBeNull()
  expect(output.code).toBe(output.toString())

  validate(output)
})

test('source() should return replaced content', () => {
  expect.assertions(3)

  const result = yufka('x + y', (node, { source, update, parent }) => {
    if (node.type === 'Identifier') {
      if (node.name === 'x') {
        expect(source(parent(node).right)).toBe('y')
        update(parent(node).right, 'z')
      } else {
        expect(source(node)).toBe('z')
      }
    }
  })

  expect(result.toString()).toBe('x + z')
})

it('should allow for multiple overrides on the same node', () => {
  expect.assertions(1)

  const result = yufka('x + y', (node, { source, update, parent }) => {
    if (node.type === 'Identifier') {
      if (node.name === 'x') {
        update(parent(node).right, 'z')
      } else {
        update('z2')
      }
    }
  })

  expect(result.toString()).toBe('x + z2')
})
