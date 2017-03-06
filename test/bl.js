'use strict'

const fs = require('fs')

const bl = require('bl')

const awaitCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const FileContents = fs.readFileSync(__filename, 'utf8')

const readFile = awaitCallback(readFileWithBlGen)

tapeRunner(function testBl (t) {
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

async function readFileWithBlGen (fileName, cb, done) {
  let rStream

  try {
    rStream = await fs.createReadStream(fileName)
  } catch (err) {
    return err
  }

  const buffer = await done(rStream.pipe(bl(cb)))
  if (cb.err) return cb.err

  return buffer
}
