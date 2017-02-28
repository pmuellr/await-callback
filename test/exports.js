'use strict'

const awaitCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

tapeRunner(function checkExports (t) {
  t.equal(typeof awaitCallback.run, 'function', 'run should be a function')
  t.equal(typeof awaitCallback.wrap, 'function', 'wrap should be a function')
  t.end()
})
