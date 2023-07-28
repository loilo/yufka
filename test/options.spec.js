const yufka = require('../dist/cjs/yufka.common')

it('should pass the base test with a Buffer source', () => {
  const { src, validate } = require('./.base-test')()

  const output = yufka(Buffer.from(src), (node, { source, update }) => {
    if (node.type === 'ArrayExpression') {
      update(`fn(${source()})`)
    }
  })

  validate(output)
})

it('should apply a custom parser', () => {
  const jsx = require('acorn-jsx')
  const acorn = require('acorn')
  const parser = acorn.Parser.extend(jsx())

  const src =
    '(function() { var f = {a: "b"}; var a = <div {...f} className="test"></div>; })()'

  const nodeTypes = [
    'Identifier',
    'Identifier',
    'Literal',
    'Property',
    'ObjectExpression',
    'VariableDeclarator',
    'VariableDeclaration',
    'Identifier',
    'Identifier',
    'JSXSpreadAttribute',
    'JSXIdentifier',
    'Literal',
    'JSXAttribute',
    'JSXIdentifier',
    'JSXOpeningElement',
    'JSXIdentifier',
    'JSXClosingElement',
    'JSXElement',
    'VariableDeclarator',
    'VariableDeclaration',
    'BlockStatement',
    'FunctionExpression',
    'CallExpression',
    'ExpressionStatement',
    'Program'
  ]

  expect.assertions(nodeTypes.length)

  yufka(src, { parser }, node => {
    expect(node.type).toBe(nodeTypes.shift())
  })
})

it('should respect acorn options', () => {
  const source = '#!/usr/bin/env node'

  expect(() =>
    yufka(source, { acorn: { allowHashBang: true } }, () => undefined)
  ).not.toThrow()

  expect(() =>
    yufka(source, { acorn: { allowHashBang: false } }, () => undefined)
  ).toThrow()
})

it('should create a high-resolution source map', () => {
  const result = yufka(
    'x + y',
    { sourceMap: { hires: true } },
    (node, { update }) => {
      if (node.type === 'Identifier' && node.name === 'y') {
        update('z')
      }
    }
  )

  expect(result.map).toEqual({
    file: undefined,
    mappings: 'AAAA,CAAC,CAAC,CAAC,CAAC',
    names: [],
    sources: [''],
    sourcesContent: undefined,
    version: 3
  })
})
