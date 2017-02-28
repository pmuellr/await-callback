'use strict'

module.exports = wrap

wrap.run = run
wrap.wrap = wrap

// wrap a generator function with awaitCallback
function wrap (asyncFn) {
  ensureAsyncFunction(asyncFn)

  return function wrapped () {
    const args = [].slice.call(arguments)
    args.unshift(asyncFn)

    run.apply(null, args)
  }
}

// call with (asyncFn, arg1, arg2, ..., cb)
async function run (asyncFn) {
  ensureAsyncFunction(asyncFn)

  // get arguments
  const args = [].slice.call(arguments)

  // remove asyncFn
  args.shift()

  // get the final arg, which is the final callback
  const cbFinal = onlyCallOnce(args.pop())
  if (typeof cbFinal !== 'function') {
    throw Error('expecting final argument to be a callback function')
  }

  // get the first cbPromise, reset when resolved
  let cbPromise = getResolvablePromise()

  // add the callback return property setter
  cbAwait.err = null
  cbAwait.errorResult = (err) => new ErrorResult(err)
  args.push(cbAwait)

  // add the wait function
  args.push(doneFn)

  // run the function, getting it's promise, then wait for it to resolve
  const resultPromise = asyncFn.apply(null, args)

  resultPromise
  .then((result) => {
    // resolve the final hanging promise
    cbPromise.resolve(null)

    // handle error returns
    if (result instanceof Error) {
      return cbFinal(result)
    } else if (result instanceof ErrorResult) {
      return cbFinal(result.err)
    }

    // handle success return values
    if (result instanceof Array) {
      result.unshift(null)
      return cbFinal.apply(null, result)
    }

    // handle success return value
    return cbFinal(null, result)
  })
  // welp, this would be a user error, guess we might lose some context,
  // but seems better than having an unhandled promise rejection
  .catch((err) => {
    throw err
  })

  // the callback function, used in the async function
  function cbAwait () {
    let result = [].slice.call(arguments)

    // pull the error off, assign to err property
    cbAwait.err = result.shift()

    // flatten result, if 0 or 1 element
    if (result.length === 0) {
      result = null
    } else if (result.length === 1) {
      result = result[0]
    }

    // resolve the promise
    cbPromise.resolve(result)

    // set next cbPromise
    cbPromise = getResolvablePromise()
  }

  // done function passed after callback, just returns current promise
  function doneFn () {
    return cbPromise
  }
}

// Returns a promise with a `resolve` method on it, to resolve it.
function getResolvablePromise () {
  let resolveFn

  const promise = new Promise(function (resolve, reject) {
    resolveFn = resolve
  })

  promise.resolve = resolveFn
  return promise
}

// throw an error if the argument is not an async function
function ensureAsyncFunction (fn) {
  if (typeof fn !== 'function') {
    throw Error('expecting an async function for first argument')
  }

  if (fn.prototype !== undefined) {
    throw Error('expecting an async function for first argument, not a plain function')
  }
}

// class to wrap objects as an explicit error
class ErrorResult {
  constructor (err) { this.err = err }
}

// return a version of a function which will only be called once
function onlyCallOnce (fn) {
  if (typeof fn !== 'function') return fn

  let called = false

  return function onlyCalledOnce () {
    if (called) return
    called = true

    return fn.apply(null, arguments)
  }
}
