const yufka = require('../dist/cjs/yufka.common')

it('should correctly access parent nodes', () => {
  expect.assertions(5)

  const src = `(function () {var xs = [ 1, 2, 3 ];fn(ys);})()`

  const output = yufka(src, (node, { source, parent, update }) => {
    if (node.type === 'ArrayExpression') {
      expect(parent().type).toBe('VariableDeclarator')
      expect(source(parent())).toBe('xs = [ 1, 2, 3 ]')
      expect(parent(2).type).toBe('VariableDeclaration')
      expect(source(parent(2))).toBe('var xs = [ 1, 2, 3 ];')
      update(parent(), 'ys = 4;')
    }
  })

  Function(['fn'], output)(x => {
    expect(x).toBe(4)
  })
})

it('should correctly access and update arbitrary traversed nodes', () => {
  expect.assertions(3)

  const output = yufka('x + y', (node, { parent, source, update }) => {
    if (node.type === 'Identifier' && node.name === 'x') {
      expect(parent().right.name).toBe('y')
      expect(source(parent().right)).toBe('y')
      update(parent().right, 'z')
    }
  })

  expect(output.toString()).toBe('x + z')
})
