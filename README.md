# @slater/themekit
A subset of [@Shopify/themekit](https://github.com/Shopify/themekit) API written in JavaScript.

## Usage
Create an instance:
```javascript
const themekit = require('@slater/themekit')

const theme = themekit({
  password: 'abcde12345',
  store: 'slater-demo.myshopify.com',
  theme_id: 123456789
})
```
### upload
Returns a `Promise`.
```
theme.upload('templates/index.liquid', './path/to/file.liquid')
```
### remove
Returns a `Promise`.
```
theme.remove('templates/index.liquid')
```

## License
MIT License
(c) 2018 Friends of Friends
