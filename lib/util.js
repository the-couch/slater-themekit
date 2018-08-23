const c = require('ansi-colors')

function log (...args) {
  console.log(
    c.gray(`@slater/themekit`),
    ...args
  )
}

function sanitizeKey (key) {
  key = key.replace(/^\//, '')

  if (!/^(layout|templates|sections|snippets|config|locales|assets)/.test(key)) {
    log(c.red(`the key provided (${key}) is not supported by Shopify`))
    return null
  }

  return key
}

module.exports = {
  sanitizeKey,
  log
}
