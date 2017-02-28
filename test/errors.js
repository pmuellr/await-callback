'use strict'

const awaitCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

function noop () {}
function * noopGen () { yield false }

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
    awaitCallback.run(noopGen, 'foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noCbWrap (t) {
  const wrappedTR = awaitCallback(noopGen)

  try {
    wrappedTR('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noGenRun (t) {
  let err
  awaitCallback.run(noop, (err_) => { err = err_ })

  t.ok(err, `should have thrown an error: ${err}`)
  t.end()
})

tapeRunner(function nullDerefBeforeYield (t) {
  let err

  try {
    awaitCallback.run(nullBeforeYield, noop)
  } catch (err_) {
    err = err_
  }

  function * nullBeforeYield (cb) {
    let obj

    obj.doSomething()
  }

  t.ok(err, `expecting error: ${err}`)
  t.end()
})

tapeRunner(function nullDerefAfterYield (t) {
  let err

  function uce (err_) { err = err_ }

  process.addListener('uncaughtException', uce)

  awaitCallback.run(nullAfterYield, noop)

  function * nullAfterYield (cb) {
    let obj

    yield setTimeout(cb, 10)
    obj.doSomething()
  }

  setTimeout(onTimeout, 100)

  function onTimeout () {
    process.removeListener('uncaughtException', uce)
    t.ok(err, `expecting error: ${err}`)
    t.end()
  }
})
