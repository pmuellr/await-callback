'use strict'

const fs = require('fs')

const awaitCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const FileContents = fs.readFileSync(__filename, 'utf8')

const readFile = function (fileName, cb) {
  awaitCallback.run(readFileAsync, fileName, cb)
}

tapeRunner(function testReadFile (t) {
  readFile(__filename, (err, buffer) => {
    t.notok(err, 'err should be null')
    t.equal(buffer.toString('utf8'), FileContents, 'buffer should be file contents')
    t.end()
  })
})

tapeRunner(function testNonExistantFile (t) {
  readFile(`${__filename}.nope`, (err, buffer) => {
    t.ok(err instanceof Error, 'err should be an Error')
    t.notok(buffer, 'buffer should be null')
    t.end()
  })
})

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
