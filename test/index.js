'use strict'

// to test with n, use:
//   n use 7.6.0 `which npm` run watch

const match = process.version.match(/^v(\d+)\./)
if (match == null) {
  console.log('unable to determine node version')
  process.exit(1)
}

const nodeVersion = parseInt(match[1], 10)
if (nodeVersion <= 6) {
  console.log('these tests require node version 7 or greater')
  process.exit(1)
}

require('./errors')
require('./exports')
require('./readFile-ac')
require('./readFile-errorResult')
require('./readFile-cb')
require('./bl')
require('./return-error')
require('./gen-args')
