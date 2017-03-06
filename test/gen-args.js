'use strict'

const awaitCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const sumArgs = awaitCallback(sumArgsGen)

tapeRunner(function testSumArgs6 (t) {
  sumArgs(1, 2, 3, (err, sum) => {
    t.notok(err, 'err should be null')
    t.equal(sum, 6, 'sum should be 6')
    t.end()
  })
})

tapeRunner(function testSumArgs132 (t) {
  sumArgs(42, 44, 46, (err, sum) => {
    t.notok(err, 'err should be null')
    t.equal(sum, 132, 'sum should be 132')
    t.end()
  })
})

async function sumArgsGen (a, b, c, cb, done) {
  // the business logic of this function is synchronous, so we need to make
  // the generator async ...
  await done(process.nextTick(cb))

  return a + b + c
}
