const path = require('path')
const fs = require('fs')
const Fontmin = require('fontmin')

const srcFontDir = path.join(__dirname, '../../../dist/assets')
const destFontDir = srcFontDir
const cssDir = path.join(__dirname, '../../../dist/assets')
if (!fs.existsSync(destFontDir)) fs.mkdirSync(destFontDir, { recursive: true })
const fontFilePaths = fs
  .readdirSync(srcFontDir, { withFileTypes: true })
  .filter(
    c => c.isFile() && (c.name.endsWith('.ttf') || c.name.endsWith('.woff2'))
  )
  .map(f => {
    const destFontPath = path.join(destFontDir, f.name)
    fs.copyFileSync(path.join(srcFontDir, f.name), destFontPath)
    return destFontPath
  })
const ttfFilePaths = fontFilePaths.filter(f => f.endsWith('.ttf'))
const cssFilePaths = fs
  .readdirSync(cssDir, { withFileTypes: true })
  .filter(dsc => dsc.isFile() && dsc.name.endsWith('.css'))
  .map(f => path.join(cssDir, f.name))
console.log(srcFontDir, destFontDir, cssDir)
console.log(fontFilePaths, ttfFilePaths, cssFilePaths)

const GLYPH_REGEX = /content\s*:[^};]*?('|")(.*?)\s*('|"|;)/g // *? is non-greedy, matches closest one
const UNICODE_REGEX = /\\([0-9a-f]{2,6})/i
// TODO: for html/js/text

/** @param {number} astralCodePoint */
function getSurrogatePair(astralCodePoint) {
  const highSurrogate = Math.floor((astralCodePoint - 0x10000) / 0x400) + 0xd800
  const lowSurrogate = ((astralCodePoint - 0x10000) % 0x400) + 0xdc00
  return [highSurrogate, lowSurrogate]
}

const cssContent = cssFilePaths
  .map(contentFile => fs.readFileSync(contentFile, { encoding: 'utf8' }))
  .join('\n')

const matches = cssContent.match(GLYPH_REGEX) || ['']
const text = matches
  .map(match => {
    const unicodeMatch = match.match(UNICODE_REGEX)
    if (!unicodeMatch) return false

    const unicodeHex = unicodeMatch[1]
    if (typeof unicodeHex === 'undefined') return false

    const numericValue = parseInt(unicodeHex, 16)
    const character = String.fromCharCode(numericValue)
    if (unicodeHex.length === 2 || unicodeHex.length === 4) return character

    const multiCharacter = getSurrogatePair(numericValue)
      .map(v => String.fromCharCode(v))
      .join('')
    return multiCharacter
  })
  .filter(Boolean)
  .join('')

ttfFilePaths.forEach(ttfPath => {
  const ttfHash = path.basename(ttfPath.slice(0, ttfPath.lastIndexOf('.ttf')))
  const ttfNoHash = ttfHash.slice(0, ttfHash.lastIndexOf('.'))

  const preWoff2Filenames = fontFilePaths
    .filter(fontFilePath => fontFilePath.endsWith('.woff2'))
    .filter(woff2FilePath => {
      const nameHash = path.basename(
        woff2FilePath.slice(0, woff2FilePath.lastIndexOf('.woff2'))
      )
      const nameNoHash = nameHash.slice(0, nameHash.lastIndexOf('.'))
      return ttfHash !== nameHash && nameNoHash === ttfNoHash
    })

  new Fontmin()
    .use(Fontmin.glyph({ text, hinting: false }))
    .src(ttfPath)
    .dest(destFontDir)
    .use(Fontmin.ttf2woff2())
    .run((err, files) => {
      if (err) return console.error('err', err)
      /**
       * @typedef {(File & {
       *             _contents: import('stream').Readable
       *             stat: fs.Stats
       *             history: fs.PathLike[]
       *             _cwd: string
       *             _base: string
       *             _isVinyl: Boolean
       *             ttfObject: any
       *           })[]} FontminResult
       * */
      const [, woff2File] = /** @type {FontminResult} */ (files)

      if (woff2File) {
        console.log('Files:', files, woff2File.history, preWoff2Filenames)
        const woff2Src = woff2File.history.pop()
        const woff2Dest = preWoff2Filenames.pop()
        // console.log('Files:', files, woff2Src, woff2Dest)
        if (woff2Src && woff2Dest) fs.renameSync(woff2Src, woff2Dest)
      }
    })
})
