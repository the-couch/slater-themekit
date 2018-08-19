const http = require('http')
const serve = require('serve-static')
const lt = require('localtunnel')
const { log } = require('./util.js')

module.exports = function (dir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      serve(dir)(req, res, () => {
        log.error(`404 error, can't find ${req.originalUrl}`)
        res.writeHead(404)
        res.end()
      })
    }).listen(3001, () => {
      const tunnel = lt(3001, (e, { url, close }) => {
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
}
