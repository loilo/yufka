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
  // tslint:disable-next-line:no-unused-expression
  expect(
    new Promise(resolve => {
      setTimeout(resolve, 20)

      yufka('false', (_, { update }) => {
        setTimeout(() => {
          update('true')
        }, 10)
      })
    })
  ).rejects
})

it('should throw when update() is called after manipulator finished (async)', () => {
  // tslint:disable-next-line:no-unused-expression
  expect(
    yufka('false', (_, { update }) => {
      setTimeout(() => {
        update('true')
      }, 20)

      return Promise.resolve()
    })
  ).rejects
})
