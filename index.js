const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const c = require('ansi-colors')
const zip = require('zip-folder')
const fetch = require('node-fetch')
const wait = require('w2t')
const readdir = require('recursive-readdir')

const createServer = require('./lib/createServer.js')
const { log, sanitizeKey } = require('./lib/util.js')

module.exports = function init (config = {}) {
  let timer

  const {
    password,
    theme_id,
    store,
    ignore_files,
    cwd = process.cwd()
  } = config

  function dir (p) {
    return path.resolve(cwd, p)
  }

  function api (method, body) {
    return fetch(`https://${store}/admin/themes/${theme_id}/assets.json`, {
      method,
      headers: {
        'X-Shopify-Access-Token': password,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }

  function onIdle (close) {
    timer && clearTimeout(timer)
    timer = setTimeout(() => close(), 5000)
  }

  return {
    bootstrap (opts = {}) {
      assert(typeof opts, 'object', `Expected opts to be an object`)

      fs.ensureDir(dir('temp'))

      zip(dir(opts.src), dir('temp/theme.zip'), e => {
        if (e) log(c.red(`bootstrap failed`), e)
      })
    },
    deploy (theme) {
      const _ = this

      return new Promise((res, rej) => {
        readdir(path.join(cwd, dir(theme)), [ '*.yml', '.DS_Store' ], (err, files) => {
          const paths = files.map(file => ([
            file.split(theme || cwd)[1],
            file
          ]))

          ;(function push (p) {
            wait(500, [
              _.upload(...p)
            ])
              .then(() => {
                if (paths.length) return push(paths.pop())
                res()
              })
              .catch(rej)
          })(paths.pop())
        })
      })
    },
    upload (key, file) {
      key = sanitizeKey(key)

      if (!key) return Promise.resolve(true)

      return createServer(cwd).then(({ url, close }) => {
        const src = url + file.replace(cwd, '') // get relative path

        return api('PUT', {
          asset: { key, src }
        })
          .then(res => res ? res.json() : {})
          .then(({ errors, asset }) => {
            if (errors) {
              throw errors
            }

            log(c.blue(`uploaded ${key} successfully`))
            onIdle(close)
          })
          .catch(e => {
            onIdle(close)
            log(c.red(`upload failed for ${key}`), e.message || e)
            return e
          })
      })
    },
    remove (key) {
      key = sanitizeKey(key)

      if (!key) return Promise.resolve(true)

      return api('DELETE', {
        asset: { key }
      })
        .then(res => res ? res.json() : {})
        .then(({ errors, asset }) => {
          if (errors) {
            throw errors
          }

          log(c.blue(`removed ${key} successfully`))
        })
        .catch(e => {
          log(c.red(`remove failed for ${key}`), e.message)
          return e
        })
    }
  }
}
