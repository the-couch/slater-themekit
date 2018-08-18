const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const zip = require('zip-folder')
const fetch = require('node-fetch')

const { log, sanitizeKey } = require('./lib/util.js')

module.exports = function init (config = {}) {
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

      const value = fs.readFileSync(dir(path), 'utf8')

      return api('PUT', {
        asset: { key, value }
      })
        .then(res => res ? res.json() : {})
        .then(() => {
          log.info(`uploaded ${key} successfully`)
        })
        .catch(e => {
          log.error(`upload failed for ${key}`, e.message)
          return e
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
