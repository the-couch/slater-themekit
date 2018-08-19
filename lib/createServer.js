const http = require('http')
const serve = require('serve-static')
const lt = require('localtunnel')
const getPort = require('get-port')
const { log } = require('./util.js')

module.exports = function (dir) {
  return getPort().then(PORT => {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        serve(dir)(req, res, () => {
          res.writeHead(404)
          res.end()
        })
      }).listen(PORT, () => {
        const tunnel = lt(PORT, (e, { url, close }) => {
          resolve({
            url,
            close (done) {
              tunnel.close()
              server.close()
              done && done()
            }
          })
        })
      })
    })
  })
}
