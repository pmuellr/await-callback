'use strict'

const fs = require('fs')

const awaitCallback = require('./await-callback')

// get fileName argument
const fileName = process.argv[2] || __filename

const readFile = awaitCallback.wrap(readFileAsync)

// read the file, print err or contents upon reading it
readFile(fileName, (err, buffer) => {
  if (err) return console.log(`error reading file '${fileName}': ${err}`)

  console.log(buffer.toString())
})

// async version of readFile()
async function readFileAsync (fileName, cb, done) {
  // fs.open()'s cb: (err, fd)
  const fd = await done(fs.open(fileName, 'r', cb))
  if (cb.err) return cb.err

  // fs.fstat()'s cb: (err, stats)
  const stats = await done(fs.fstat(fd, cb))
  if (cb.err) return cb.err

  const buffer = new Buffer(stats.size)

  // fs.read()'s cb: (err, bytesRead, buffer)
  const bytesReadBuffer = await done(fs.read(fd, buffer, 0, buffer.length, 0, cb))
  if (cb.err) return cb.err

  // fs.read()'s cb invoked as cb(err, bytesRead, buffer), so we get an array
  const bytesRead = bytesReadBuffer[0]
  const bufferRead = bytesReadBuffer[1]
  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  // fs.close()'s cb: (err)
  await done(fs.close(fd, cb))
  if (cb.err) return cb.err

  // invokes readFile()'s cb as cb(null, bufferRead)
  return bufferRead
}
