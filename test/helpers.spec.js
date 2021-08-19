const yufka = require('../dist/cjs/yufka.common')

test('should expose node helpers', () => {
  expect.assertions(11)

  const output = yufka('x + y', (node, { source, parent }) => {
    expect(yufka.source(node)).toBe(source())
    expect(yufka.parent(node)).toBe(parent())

    if (node.type === 'Identifier') {
      yufka.update(node, 'z')
    }
  })

  expect(output.code).toBe('z + z')
})
