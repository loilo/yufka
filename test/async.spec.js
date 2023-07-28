const yufka = require('../dist/cjs/yufka.common')

it('should correctly handle Promises returned from the manipulator', async () => {
  const { src, validate } = require('./.base-test')()

  let pending = 0
  const output = await yufka(src, (node, { update, source }) => {
    if (node.type === 'ArrayExpression') {
      return new Promise(resolve => {
        pending++
        setTimeout(() => {
          update(`fn(${source()})`)
          pending--
          resolve()
        }, 50 * pending * 2)
      })
    }
  })

  validate(output)
})

it('should throw when update() is called after manipulator finished (sync)', async () => {
  expect.hasAssertions()

  await new Promise(resolve => {
    setTimeout(resolve, 20)

    yufka('false', (_, { update }) => {
      setTimeout(() => {
        expect(() => {
          update('true')
        }).toThrowError()
      }, 10)
    })
  })
})

it("should throw when update() is called after iterated node's manipulator finished (async)", async () => {
  expect.hasAssertions()

  await yufka('false', (_, { update }) => {
    setTimeout(() => {
      expect(() => {
        update('true')
      }).toThrowError()
    }, 10)

    return Promise.resolve()
  })

  await new Promise(resolve => setTimeout(resolve, 20))
})

it("should throw when update() is called after target node's manipulator finished", () => {
  expect.hasAssertions()

  yufka('false', (node, { update }) => {
    if (node.type === 'ExpressionStatement') {
      expect(() => {
        update(node.expression, 'true')
      }).toThrowError()
    }
  })
})
