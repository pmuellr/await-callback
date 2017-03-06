await-callback - run async/callback functions in a sync style, with async/await
================================================================================

This library makes it easy to write code that makes serial calls to async
functions that use callbacks in the typical "Node.js" style - eg, `cb(err, data)`.
Forget the [Callback Hell][] - and write code that looks like it's synchronous,
but isn't.  Thanks to the magic that is [`async`/`await`][async-await].

This code only works with Node.js version 7 or above, or perhaps with Node.js
code transpiled with Babel or similar which generates code for `async` / `await`.

Note that this is the `async`/`await` version of
[`yield-callback`][yield-callback], which uses generators.

[Callback Hell]:  http://callbackhell.com/
[async-await]:    https://developers.google.com/web/fundamentals/getting-started/primers/async-functions
[yield-callback]: https://github.com/pmuellr/yield-callback


example
================================================================================

Say you want to write a function `readFile()` which reads the contents of a file
using the `fs` module.  Here's how you would do it using Node.js's low-level
`fs` module functions, in a fairly typical pyramid-of-callback-hell-doom:

```js
function readFile (fileName, cb) {
  fs.open(fileName, 'r', function (err, fd) {
    if (err) return cb(err)

    fs.fstat(fd, function (err, stats) {
      if (err) return cb(err)

      const buffer = new Buffer(stats.size)

      fs.read(fd, buffer, 0, buffer.length, 0, function (err, bytesRead, bufferRead) {
        if (err) return cb(err)
        if (bytesRead !== buffer.length) return cb(new Error('EMOREFILE'))

        fs.close(fd, function (err) {
          if (err) return cb(err)

          cb(null, bufferRead)
        })
      })
    })
  })
}
```

With `await-callback`, you can write it like this instead:

```js
async function readFileAsync (fileName, cb, done) {
  const fd = await done(fs.open(fileName, 'r', cb))
  if (cb.err) return cb.err

  const stats = await done(fs.fstat(fd, cb))
  if (cb.err) return cb.err

  const buffer = new Buffer(stats.size)

  const [bytesRead, bufferRead] = await done(fs.read(fd, buffer, 0, buffer.length, 0, cb))
  if (cb.err) return cb.err

  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  await done(fs.close(fd, cb))
  if (cb.err) return cb.err

  return bufferRead
}
```

Your `readFile()` function will be implemented as an async function.

Note the async function takes a `cb` and `done` parameters at the end. The
`cb` parameter should be used as the
the callback for async "errback" functions called inside the async function.
The `done` parameter is a function which returns a promise when the callback
is invoked, and should be used as the argument to the `await` statement.
The callback `cb` will resolve the promise returned by `done` when the 
callback is called.  It will arrange for the `await done(...)` expressions to
return the result of the callback, or to set the `cb.err` property to the error
result of the callback.

You can then invoke the async function as below.  Note that you pass a "normal"
callback function in as the final parameter to `run()`, which will be invoked
when the generator finally returns.  If the generator returns an error, the
first argument will be that error.  Otherwise, the second argument will be set
to the return value.  Just like a typical Node.js async callback:

```js
awaitCallback.run(readFileAsync, fileName, function (err, buffer) {
  if (err) console.log(err)
  else console.log(buffer.toString('utf8'))
})
```

Or you can wrap the generator to return a "typical errback" function; in this
case, with the same signature and behavior as the pyramid-of-doom `readFile()`
above:

```js
const readFile = awaitCallback(readFileAsync)

readFile(fileName, function (err, buffer) {
  if (err) console.log(err)
  else console.log(buffer.toString('utf8'))
})
```

install
================================================================================

    npm install await-callback


API
================================================================================

This module exports a function which takes an async function as a parameter
and returns a new function with the same signature as the generator function.
For the remainder of this document, we'll refer to this function as
`awaitCallback()`, as if you had done a:

```js
const awaitCallback = require('await-callback')
```

The returned function takes a callback which will be invoked when the generator
returns.  The generator itself gets passed a `cb` argument and `done` argument as it's final
parameters.  The `cb` argument should be passed as the "callback" function on any async calls
that you make, and the `done` function should be called with the async function
you are invoking, and used as the argument of the `await` statement:

```js
async function myAsyncFunction(a, b, cb, done) {
  console.log('waiting(a)', a, 'ms')
  await done(setTimeout(cb, a))

  console.log('waiting(b)', b, 'ms')
  await done(setTimeout(cb, b))

  return a + b
}

const myWrapped = awaitCallback(myGenerator)

myWrapped(1000, 2000, function (err, val) {
  console.log('should be 3000:', val)
})
```

You can also run an async functiondirectly, via the `run` function available on the
exported function (eg, `awaitCallback.run()`).

The following are equivalent:

```js
awaitCallback.run(asyncFunction, arg1, arg2, ... callback)
```

```js
const wrapped = awaitCallback(asyncFunction)
wrapped(arg1, arg2, ... callback)
```


### API within the async function

When the async function is invoked, it's final arguments are a special
callback function to be used with async callback functions called within the
generator, and a "done" function used with the `await` statement.
The callback function can be used as the callback function in an async
callback function, if the function used is called from the "done" function,
which is passed to the `await` statement:

```js
async function asyncFunction(a, b, cb, done) {
  ...
  await done(setTimeout(cb, 1000))

  // code following this comment won't run for 1000 milliseconds
  ...
}
```

The `await` expression returns a value, which is the "result" passed to the
callback.  The "error" passed to the callback is available as `cb.err`.

```js
async function asyncFunction(fileName, cb, done) {
  // fs.readFile()'s cb: (err, fileContents)
  const fileContents = await done(fs.readFile(fileName, 'utf8', cb))

  // the `err` argument of the callback is available in `cb.err`
  if (cb.err) return cb.err

  console.log(fileContents) // print the file contents
}
```

If the callback is invoked with a non-null first argument, eg `cb(err)`, the
result will be `null`, and `cb.err` will be set to that argument.

If the callback is invoked with a single response value, eg `cb(null, 1)`, the
result will be the single response value, and `cb.err` will be `null`.

If the callback is invoked with multiple response values, eg, `cb(null, 1, 2)`,
the result will be an array of the response values, eg `[1, 2]`, and `cb.err`
will be `null`.

The value that the async function finally returns will be passed to the original
callback back passed into the wrapped (or run) function.  That callback should
have the signature `cb(err, data)`.

If the generator returns an instance of Error, the callback will be invoked with
that error as the first parameter.

If the generator return anything else, the callback will be invoked with a null
error, and that returned object as the second parameter.

In case you're not sure, or know, that the `err` object you want to return from
a generator **isn't** an instance of Error, you can use the function
`cb.errorResult()` to wrap your object so that it will be treated as an error
result, rather than a non-error object passed as the second callback parameter:


```js
awaitCallback.run(asyncFunction, aFileName, function outerCB (err, data) {})

async function asyncFunction(fileName, cb) {
  const data = await done(fs.readFile(fileName, 'utf8', cb))

  if (cb.err) return cb.err                  // calls outerCB(err)

  if (cb.err) return cb.errorResult(cb.err)  // also calls outerCB(err),
                                             // even if `cb.err` isn't an
                                             // instance of Error

  return data                                // calls outerCB(null, data)
}
```
