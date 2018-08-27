const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const c = require('ansi-colors')
const zip = require('zip-folder')
const fetch = require('node-fetch')
const wait = require('w2t')
const readdir = require('recursive-readdir')

const { log, sanitizeKey } = require('./lib/util.js')

module.exports = function init (config = {}) {
  let timer

  /**
   * TODO
   * does this still need to be global?
   */
  let uploadingPaths = []

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

  function push () {
    return new Promise((res, rej) => {
      ;(function _push (p) {
        wait(500, [
          upload(...p)
        ])
          .then(() => {
            if (uploadingPaths.length) return _push(uploadingPaths.pop())
            res()
          })
          .catch(rej)
      })(uploadingPaths.pop())
    })
  }

  function bootstrap (opts = {}) {
    assert(typeof opts, 'object', `Expected opts to be an object`)

    fs.ensureDir(dir('temp'))

    zip(dir(opts.src), dir('temp/theme.zip'), e => {
      if (e) log(c.red(`bootstrap failed`), e)
    })
  }

  function deploy (theme) {
    return new Promise((res, rej) => {
      readdir(path.join(cwd, dir(theme)), [ '*.yml', '.DS_Store' ], (err, files) => {
        uploadingPaths = uploadingPaths.concat(
          files.map(file => ([
            file.split(theme || cwd)[1],
            file
          ]))
        )

        push().then(res).catch(rej)
      })
    })
  }

  function upload (key, file) {
    key = sanitizeKey(key)

    if (!key) return Promise.resolve(true)

    const encoded = Buffer.from(fs.readFileSync(file), 'utf-8').toString('base64')

    return api('PUT', {
      asset: {
        key,
        attachment: encoded
      }
    })
      .then(res => res ? res.json() : {})
      .then(({ errors, asset }) => {
        if (errors) {
          throw errors
        }

        log(c.blue(`uploaded ${key} successfully`))
      })
      .catch(e => {
        log(c.red(`upload failed for ${key}`), e.message || e)
        return e
      })
  }

  function remove (key) {
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

  return {
    deploy,
    upload,
    remove
  }
}
