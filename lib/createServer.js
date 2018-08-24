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
        const tunnel = ngrok.connect(PORT)
          .then(url => {
            resolve({
              url,
              close (done) {
                Promise.all([
                  ngrok.disconnect(),
                  server.close()
                ]).then(() => {
                  ngrok.kill()
                  activeServer = null
                  done && done()
                })
              }
            })
          })
          .catch(e => {
            log(c.red('ngrok'), e.message || e)
            reject(e)
          })
      })
    })
  }).catch(e => {
    log(c.red('port assignment'), e.message || e)
  })

  return activeServer
}
