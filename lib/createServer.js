const http = require('http')
const serve = require('serve-static')
const ngrok = require('ngrok')
const getPort = require('get-port')
const { log } = require('./util.js')

let activeServer

module.exports = function (dir) {
  activeServer = activeServer || getPort().then(PORT => {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        serve(dir)(req, res, () => {
          res.writeHead(404)
          res.end()
        })
      }).listen(PORT, () => {
        const tunnel = ngrok.connect(PORT).then(url => {
          resolve({
            url,
            close (done) {
              Promise.all([
                ngrok.disconnect(url),
                server.close()
              ]).then(() => {
                done && done()
                activeServer = null
              })
            }
          })
        })
      })
    })
  })

  return activeServer
}
