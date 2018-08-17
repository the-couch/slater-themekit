const c = require('ansi-colors')

const log = {
  info (...args) {
    console.info(
      c.gray(`@slater/themekit`),
      c.blue(args.shift()),
      ...args
    )
  },
  error (...args) {
    console.error(
      c.gray(`@slater/themekit`),
      c.red(args.shift()),
      ...args
    )
  }
}

function sanitizeKey (key) {
  key = key.replace(/^\//, '')

  if (!/^(layouts|templates|sections|snippets|config|assets)/.test(key)) {
    log.error(`the key provided (${key}) is not supported by Shopify`)
    return null
  }

  return key
}

module.exports = {
  sanitizeKey,
  log
}
