const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const zip = require('zip-folder')
const fetch = require('node-fetch')
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
    timer = setTimeout(() => {
      close()
      log.info(`upload server closed`)
    }, 2000)
  }

  return {
    bootstrap (opts = {}) {
      assert(typeof opts, 'object', `Expected opts to be an object`)

      fs.ensureDir(dir('temp'))

      zip(dir(opts.src), dir('temp/theme.zip'), e => {
        if (e) log.error(`bootstrap failed`, e)
      })
    },
    upload (key, path) {
      key = sanitizeKey(key)

      if (!key) return Promise.resolve(true)

      timer = Date.now()

      return createServer(cwd).then(({ url, close }) => {
        const src = url + path

        log.info(`upload server opened`)

        return api('PUT', {
          asset: { key, src }
        })
          .then(res => res ? res.json() : {})
          .then(res => {
            log.info(`uploaded ${key} successfully`)
            onIdle(close)
          })
          .catch(e => {
            onIdle(close)
            log.error(`upload failed for ${key}`, e.message)
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
        .then(() => {
          log.info(`removed ${key} successfully`)
        })
        .catch(e => {
          log.error(`remove failed for ${key}`, e.message)
          return e
        })
    }
  }
}
