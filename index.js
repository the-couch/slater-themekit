const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const c = require('ansi-colors')
const zip = require('zip-folder')
const fetch = require('node-fetch')

const log = {
  info (...args) {
    console.info(
      c.gray(`@slater/themekit`),
      c.blue(args.unshift()),
      ...args
    )
  },
  error (...args) {
    console.error(
      c.gray(`@slater/themekit`),
      c.red(args.unshift()),
      ...args
    )
  }
}

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
      const value = fs.readFileSync(dir(path), 'utf8')

      return api('PUT', {
        asset: { key, value }
      })
        .then(res => res.json())
        .catch(e => {
          log.error('upload failed', e)
          return e
        })
    },
    remove (key) {
      return api('DELETE', {
        asset: { key }
      })
        .then(res => res.json())
        .catch(e => {
          log.error('remove failed', e)
          return e
        })
    }
  }
}
