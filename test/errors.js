'use strict'

const awaitCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

function noop () {}
async function noopAsync () { await false }

tapeRunner(function noGeneratorRun (t) {
  try {
    awaitCallback.run('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noGeneratorWrap (t) {
  try {
    awaitCallback('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noCbRun (t) {
  try {
    awaitCallback.run(noopAsync, 'foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noCbWrap (t) {
  const wrappedTR = awaitCallback(noopAsync)

  try {
    wrappedTR('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noGenRun (t) {
  try {
    awaitCallback.run(noop, () => {})
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function nullDerefBeforeAwait (t) {
  let err

  function uce (err_) { err = err_ }

  process.addListener('uncaughtException', uce)

  awaitCallback.run(nullBeforeAwait, noop)

  async function nullBeforeAwait (cb, done) {
    let obj

    obj.doSomething()
  }

  setTimeout(onTimeout, 100)

  function onTimeout () {
    process.removeListener('uncaughtException', uce)
    t.ok(err, `expecting error: ${err}`)
    t.end()
  }
})

tapeRunner(function nullDerefAfterAwait (t) {
  let err

  function uce (err_) { err = err_ }

  process.addListener('uncaughtException', uce)

  awaitCallback.run(nullAfterAwait, noop)

  async function nullAfterAwait (cb, done) {
    let obj

    await done(setTimeout(cb, 10))
    obj.doSomething()
  }

  setTimeout(onTimeout, 100)

  function onTimeout () {
    process.removeListener('uncaughtException', uce)
    t.ok(err, `expecting error: ${err}`)
    t.end()
  }
})
