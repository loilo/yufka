/**
 * This is the touchstone test for Yufka.
 *
 * It offers some `src` code to be transformed by the test so that the
 * resulting code satisfies the `validate()` function.
 * This is the case when the transformation wraps each array of `src`
 * in a `fn()` call.
 *
 * @param {number} additionalTests Number of additional tests performed
 *                                 outside of the validate() function
 */
function arrayBase(additionalTests = 0) {
  expect.assertions(5 + additionalTests)

  return {
    src: `(function () {
  var xs = [ 1, 2, [ 3, 4 ] ];
  var ys = [ 5, 6 ];
  g([ xs, ys ]);
})()`,

    validate(output) {
      const arrays = [
        // inner xs
        [3, 4],

        // outer xs
        [1, 2, [3, 4]],

        // ys
        [5, 6],

        // [ xs, ys ]
        [[1, 2, [3, 4]], [5, 6]]
      ]

      Function(['fn', 'g'], output)(
        xs => {
          expect(arrays.shift()).toEqual(xs)
          return xs
        },
        xs => {
          expect(xs).toEqual([[1, 2, [3, 4]], [5, 6]])
        }
      )
    }
  }
}

module.exports = arrayBase
