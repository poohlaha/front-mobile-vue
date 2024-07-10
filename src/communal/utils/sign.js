import CryptoJS from 'crypto-js'
import { CONSTANT, SYSTEM } from '@configs/index'
import Utils from './utils'

/**
 * 签名
 */
const Signature = {
  /**
   * 生成签名
   * @param headers header头数据
   */
  sign: (headers = {}) => {
    const timestamp = new Date().getTime() // 时间戳
    const nonce = Math.random() + ''
    const echoStr = Utils.generateUUID().toString().replace('-', '')
    headers['timestamp'] = timestamp
    headers['nonce'] = nonce
    headers['echoStr'] = echoStr
    headers['sophia_superficial'] = CryptoJS.HmacSHA1(timestamp + nonce + echoStr, SYSTEM.SIGNATURE.SIGNATURE_KEY)
  },

  /**
   * AES加密
   * @param data 需要加密的内容, 字符串或JSON对象
   * @param publicKey 密钥
   * @param iv 偏移量
   */
  encrypt: (data = {}, publicKey = SYSTEM.SIGNATURE.PUBLIC_KEY, iv = SYSTEM.SIGNATURE.CBCIV) => {
    if (typeof data !== 'string') data = JSON.stringify(data)
    return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(data), CryptoJS.enc.Utf8.parse(publicKey), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString()
  },

  /**
   * AES解密
   * @param data 解密的内容
   * @param publicKey 密钥
   * @param iv 偏移量
   */
  decrypt: (data = {}, publicKey = SYSTEM.SIGNATURE.PUBLIC_KEY, iv = SYSTEM.SIGNATURE.CBCIV) => {
    const decrypt = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(publicKey), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return CryptoJS.enc.Utf8.stringify(decrypt).toString()
  },

  /**
   * 生成文件上传签名
   * @param headers header头数据
   */
  signUpload: (headers = {}) => {
    const timestamp = new Date().getTime() // 时间戳
    const nonce = Utils.generateUUID().toString()
    headers['timestamp'] = timestamp
    headers['nonce'] = nonce
    headers['signature'] = Signature.hmacSha256Encrypt(`${timestamp}&${nonce}`)
  },

  /**
   * hmacSha256加密
   * @param data 需要加密的内容, 字符串或JSON对象
   */
  hmacSha256Encrypt: (data = '') => {
    if (typeof data !== 'string') data = JSON.stringify(data)
    const hash = CryptoJS.HmacSHA256(data, SYSTEM.SIGNATURE.MHMAC_SHA256_PUBLIC_KEY)
    return CryptoJS.enc.Hex.stringify(hash)
    // return CryptoJS.HmacSHA256(data, SYSTEM.SIGNATURE.MHMAC_SHA256_PUBLIC_KEY)
  },
}

/**
 * 设置请求头
 * @param config 详见 request/index.js 类注释
 */
const setHeaders = (config = {}) => {
  if (!config) return {} // 校验 config
  if (!config.url) return {} // 校验 url

  let type = config.type || CONSTANT.REQUEST.DEFAULT_URL_FORMAT
  if (type.toUpperCase() === CONSTANT.REQUEST.DEFAULT_URL_FORMAT) {
    type = CONSTANT.REQUEST.DEFAULT_CONTENT_TYPE
  } else if (type.toUpperCase() === 'FORM') {
    type = null
  } else {
    type = CONSTANT.REQUEST.DEFAULT_FORM_URLENCODED
  }

  const headers = config.headers || {}
  headers[CONSTANT.REQUEST.X_REQUESTED_WITH] = CONSTANT.REQUEST.DEFAULT_X_REQUESTED_WITH
  headers[SYSTEM.TOKEN_NAME] = Utils.getLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.LOCAL_TOKEN}`) || ''

  if (type) {
    headers[CONSTANT.REQUEST.CONTENT_TYPE_NAME] = type
  }

  // 添加文件上传签名
  Signature.signUpload(headers)

  // 是否需要签名
  if (SYSTEM.NEED_SIGN) {
    Signature.sign(headers)
  }
  return headers
}

/**
 * 设置token
 * @param response 返回的数据, JSON对象
 * @param config 详见 request/index.js 类注释
 */
const setToken = (response = {}, config = {}) => {
  const headers = response.headers
  if (!headers) return

  let header = null
  try {
    header = headers.get(SYSTEM.TOKEN_NAME)
    if (!header) {
      header = headers.get(SYSTEM.TOKEN_NAME.toLowerCase())
    }
  } catch (e) {
    try {
      header = headers[SYSTEM.TOKEN_NAME]
      if (!header) {
        header = headers[SYSTEM.TOKEN_NAME.toLowerCase()]
      }
    } catch (e) {
      header = null
    }
  }

  if (!header) {
    return
  }

  // 保存 TOKEN
  Utils.removeLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.LOCAL_TOKEN}`)
  Utils.setLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.LOCAL_TOKEN}`, header)
}

export { Signature, setToken, setHeaders }
