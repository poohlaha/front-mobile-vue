import CryptoJS from 'crypto-js'

const Utils = {
  /**
   * 从localStorage中设置值
   * @param key setItem 的 key 值
   * @param data 数据
   * @param needExpTime 是否需要过期时间
   */
  setLocal: (key = '', data, needExpTime = false) => {
    if (Utils.isBlank(data)) return

    let item = null
    if (needExpTime) {
      item = {
        data,
        time: new Date().getTime(),
      }
    } else {
      item = data
    }

    if (typeof item !== 'string') item = JSON.stringify(item)
    window.localStorage.setItem(key, Utils.encrypt(item))
  },

  /**
   * 从localStorage中获取值
   * @param key getItem 的 key 值
   * @param needExpTime 是否需要过期时间
   */
  getLocal: (key = '', needExpTime = false) => {
    const item = window.localStorage.getItem(key)
    if (!item) return null

    const data = Utils.decrypt(item)
    if (needExpTime) {
      return JSON.parse(data)
    }

    return Utils.isStringObject(data) ? JSON.parse(data) : data
  },

  /**
   * 从localStorage中移除token
   * @param key removeItem 中的 key
   */
  removeLocal: (key = '') => {
    window.localStorage.removeItem(key)
  },

  /**
   * 从sessionStorage中设置值
   * @param key setItem 的 key 值
   * @param data 数据
   * @param needExpTime 是否需要过期时间
   */
  setSession: (key = '', data, needExpTime = false) => {
    if (Utils.isBlank(data)) return

    let item = null
    if (needExpTime) {
      item = {
        data,
        time: new Date().getTime(),
      }
    } else {
      item = data
    }

    if (typeof item !== 'string') item = JSON.stringify(item)
    window.sessionStorage.setItem(key, Utils.encrypt(item))
  },

  /**
   * 从sessionStorage中获取值
   * @param key getItem 的 key 值
   * @param needExpTime 是否需要过期时间
   */
  getSession: (key = '', needExpTime = false) => {
    const item = window.sessionStorage.getItem(key)
    if (!item) return null

    const data = Utils.decrypt(item)
    if (needExpTime) {
      return JSON.parse(data)
    }

    return Utils.isStringObject(data) ? JSON.parse(data) : data
  },

  /**
   * 从sessionStorage中移除值
   * @param key removeItem 的 key 值
   */
  removeSession: (key = '') => {
    window.sessionStorage.removeItem(key)
  },

  /**
   * 从localStorage移除所有数据
   */
  clearLocalStorage: () => {
    window.localStorage.clear()
  },

  /**
   * 从sessionStorage移除所有数据
   */
  clearSessionStorage: () => {
    window.sessionStorage.clear()
  },

  /**
   * 生成随机数
   */
  generateUUID: () => {
    const random = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    return random() + random() + '-' + random() + '-' + random() + '-' + random() + '-' + random() + random() + random()
  },

  /**
   * 生成随机数
   */
  generateRandom: (count = 0) => {
    if (count === 0) return '0'

    let data = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    let result = ''
    for (let i = 0; i < count; i++) {
      //产生20位就使i<20
      let r = Math.floor(Math.random() * 10)
      result += data[r]
    }

    return result
  },

  /**
   * UTF-8 加密
   * @param str 要加密的字符串
   */
  encrypt: (str = '') => {
    if (!str) return ''
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
  },

  /**
   * UTF-8 解密
   * @param str 要解密的字符串
   */
  decrypt: (str = '') => {
    if (!str) return ''
    return CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Utf8)
  },

  /**
   * 获取当前时间
   */
  getCurrentTime: () => {
    let currentTime = null
    const hasPerformanceNow = typeof performance === 'object' && typeof performance.now === 'function'
    if (hasPerformanceNow) {
      const localPerformance = performance
      currentTime = () => localPerformance.now()
    } else {
      const localDate = Date
      const initialTime = localDate.now()
      currentTime = () => localDate.now() - initialTime
    }

    return currentTime
  },

  /**
   * 格式化日期
   * @param date 日期
   * @param format 格式
   */
  formatDate: (date, format = 'yyyy-MM-dd') => {
    if (Utils.isBlank(date)) return ''

    switch (typeof date) {
      case 'string':
        date = new Date(date.replace(/-/, '/'))
        break
      case 'number':
        date = new Date(date)
        break
      default:
        date = null
        break
    }
    if (!(date instanceof Date)) return ''
    const dict = {
      yyyy: date.getFullYear(),
      M: date.getMonth() + 1,
      d: date.getDate(),
      H: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds(),
      MM: ('' + (date.getMonth() + 101)).substr(1),
      dd: ('' + (date.getDate() + 100)).substr(1),
      HH: ('' + (date.getHours() + 100)).substr(1),
      mm: ('' + (date.getMinutes() + 100)).substr(1),
      ss: ('' + (date.getSeconds() + 100)).substr(1),
    }
    return format.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, function () {
      return dict[arguments[0]]
    })
  },

  /**
   * 日期补全
   * @param date 日期
   * @param needTime 是否需要时/分/秒
   */
  completionDate: (date, needTime = true) => {
    if (Utils.isBlank(date)) return ''
    const pad = n => (n < 10 ? `0${n}` : n)
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    if (!needTime) return `${dateStr}`

    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`
    return `${dateStr} ${timeStr}`
  },

  /**
   * 格式化价格
   * @param price 价格
   */
  formatPrice: price => {
    if (!price || Utils.isBlank(price)) return '0.00'
    return String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  /**
   * 价格添加符号
   * @param price 价格
   */
  addPriceSymbol(price) {
    if (String(price) === '0.00' || price === 0 || Utils.isBlank(String(price))) return '0.00'
    if (!String(price).startsWith('+') && price > 0) {
      price = `+${price}`
    }
    return Utils.formatPrice(price)
  },

  /**
   * 获取以万为单位的价格
   * @param price 价格
   */
  getTenThousandPrice(price) {
    if (String(price) === '0.00' || price === 0 || Utils.isBlank(String(price))) return 0
    return Number(Number(Number(price) / 10000).toFixed(2))
  },

  /**
   * 获取百分比
   * @param data 数据
   */
  getPercentage(data) {
    if (!data) return '0'
    return (Number(data) * 100).toFixed(2)
  },

  /**
   * 获取绝对值
   * @param data 数据
   */
  getAbs(data) {
    if (!data || Utils.isBlank(data)) return 0
    return Math.abs(Number(data))
  },

  /**
   * 根据code获取json数组中的文本
   * @param code --- 需要查询的代码
   * @param arr -- 需要查询的数组
   * @param prop -- 需要比较的属性
   * @param returnProp -- 需要返回的属性
   */
  getJsonTextByCode: (code, arr = [], prop = 'code', returnProp = 'text') => {
    const newArr = arr.filter(item => item[prop] === code) || []
    // returnProp === 'all' 返回整个对象
    return newArr.length > 0 ? (returnProp === 'all' ? newArr[0] : newArr[0][returnProp]) || '' : ''
  },

  /**
   * 检验字符串是否为空
   * @param str 要检查的值
   */
  isBlank: (str = '') => str === undefined || str == null || /^[ ]+$/.test(str) || str.length === 0,

  /**
   * 格式化电话号码, 前三位、四位一体
   * @param phone 电话号码
   */
  formatPhone: (phone = '') => {
    if (Utils.isBlank(phone)) return ''
    phone = Utils.getFormatPhone(phone).trim()
    return phone.replace(/^(.{3})(.*)(.{4})/, '$1 $2 $3')
  },

  /**
   * 获取格式化后的手机号
   * @param phone 电话号码
   */
  getFormatPhone: (phone = '') => {
    if (!Utils.isBlank(phone)) {
      // 去除空格
      phone = phone.replace(/ /g, '')
    }

    return phone
  },

  /**
   * 缓存数据
   * @param key -- cache key
   * @param value -- cache value
   * @param isSessionStorage --- 是否存储在 sessionStorage
   */
  setCache: (key = '', value, isSessionStorage = false) => {
    if (isSessionStorage) {
      Utils.setSession(Utils.encrypt(key), value, true)
    } else {
      Utils.setLocal(Utils.encrypt(key), value, true)
    }
  },

  /**
   * 获取缓存数据
   * @param key -- cache key
   * @param expireTime -- 过期时间, 默认 30 天
   * @param isSessionStorage --- 是否存储在 sessionStorage
   */
  getCache: (key = '', expireTime = 30 * 24 * 60 * 60 * 1000, isSessionStorage = false) => {
    const data = isSessionStorage
      ? Utils.getSession(Utils.encrypt(key), true) || {}
      : Utils.getLocal(Utils.encrypt(key), true) || {}
    if (JSON.stringify(data) === '{}') return {}

    const time = data.time || 0
    const date = new Date().getTime()
    if (date - time >= expireTime) {
      isSessionStorage ? Utils.removeSession(key) : Utils.removeLocal(key)
    }
    return new Date().getTime() - time > expireTime ? {} : data.data || {}
  },

  /**
   * 清除缓存
   * @param key 缓存中的key
   */
  clearCache: (key = '') => {
    Utils.removeLocal(Utils.encrypt(key))
  },

  /**
   * 判断对象是否为空
   * @param target JSON对象
   */
  isObjectNull: (target = {}) => JSON.stringify(target) === '{}',

  /**
   * 深拷贝
   */
  deepCopy: o => {
    if (o instanceof Array) {
      const n = []
      for (let i = 0; i < o.length; ++i) {
        n[i] = Utils.deepCopy(o[i])
      }
      return n
    } else if (o instanceof Object) {
      const n = {}
      for (const i in o) {
        n[i] = Utils.deepCopy(o[i])
      }
      return n
    } else {
      return o
    }
  },

  /**
   * 首字母转大写或小写
   * @param str --- 要转换的字符串
   * @param needUpperCase --- 首字母是否需要转成大写
   */
  capitalizeFirstChar: (str = '', needUpperCase = true) => {
    if (Utils.isBlank(str)) return ''
    let firstChar = str.substring(0, 1)
    const surplusChar = str.substring(1, str.length)
    firstChar = needUpperCase ? firstChar.toUpperCase() : firstChar.toLowerCase()
    return firstChar + surplusChar
  },

  /**
   * 驼峰转换下划线
   * @param str --- 要转换的字符串
   * @param separator --- 分割符, 默认: -
   */
  charToLine: (str = '', separator = '-') => {
    if (Utils.isBlank(str)) return ''
    let word = ''
    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      if (char >= 'A' && char <= 'Z' && i !== 0 && i !== str.length - 1) {
        word += `${separator}${char.toLowerCase()}`
      } else {
        word += char.toLowerCase()
      }
    }

    return word
  },

  /**
   * 检验手机号码是否正确
   * @param phone
   */
  validatePhone: (phone = '') => {
    let phoneReg = /^1(3|4|5|6|7|8|9)\d{9}$/
    return phoneReg.test(phone)
  },

  /**
   * 加密身份证
   * @param card 加密身份证
   */
  encryptCardNo: (card = '') => {
    if (Utils.isBlank(card)) return ''
    return card.replace(/^(.{4})(?:\d+)(.{4})$/, '$1******$2')
  },

  /**
   * 加密手机号
   * @param phone 手机号码
   */
  encryptPhone: (phone = '') => {
    if (Utils.isBlank(phone)) return ''
    return phone.replace(/^(.{3})(?:\d+)(.{4})$/, '$1****$2')
  },

  /**
   * 根据生日获取年龄
   * @param birthday 生日
   */
  getAgeByBirthday: (birthday = '') => {
    if (Utils.isBlank(birthday)) return 0
    const currentYear = new Date().getFullYear()
    const bir = birthday.split('-')[0]
    if (!bir) return 0
    const age = Number(currentYear) - Number(bir)
    return age <= 0 ? 1 : age
  },

  /**
   * 判断字符串是不是对象字符中
   * @param str 字符串
   */
  isStringObject: (str = '') =>
    Object.prototype.toString.call(str) === '[object String]' && str.startsWith('{') && str.endsWith('}'),

  /**
   * 是否是 IOS
   */
  isIos: () => !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),

  /**
   * 判断是否 Android
   */
  isAndroid: () => navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Linux') > -1,

  /**
   * 获取设备列表
   */
  getDeviceList: () => {
    const u = navigator.userAgent // app = navigator.appVersion
    return {
      trident: u.indexOf('Trident') > -1, // IE内核
      presto: u.indexOf('Presto') > -1, // opera内核
      webKit: u.indexOf('AppleWebKit') > -1, // 苹果、谷歌内核
      gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') === -1, // 火狐内核
      mobile: !!u.match(/AppleWebKit.*Mobile.*/), // 是否为移动终端
      ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), // ios终端
      android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, // android终端
      iPhone: u.indexOf('iPhone') > -1, // 是否为iPhone或者QQHD浏览器
      iPad: u.indexOf('iPad') > -1, // 是否iPad
      webApp: u.indexOf('Safari') === -1, // 是否web应该程序，没有头部与底部
      weixin: u.indexOf('MicroMessenger') > -1, // 是否微信
      qq: u.match(/\sQQ/i) == ' qq', // 是否QQ
    }
  },

  /**
   * 打开app
   *  [scheme:][//authority][path][?query][#fragment]
   *  500ms内，本机有应用程序能解析对应的协议并打开程序，调用该应用；
   *  如果本机没有应用程序能解析该协议或者500ms内没有打开这个程序，
   *  则执行setTimeout里面的function，跳转到下载页面。
   *  @param iosAppId: appId
   *  @param iphoneSchema: IOS App 协议
   *  @param iosAppDownloadUrl: IOS App 下载地址 https://itunes.apple.com/cn/app/id@appId@
   *  @param androidSchema: Android App 协议
   *  @param androidAppDownloadUrl: Android App 下载地址
   */
  openApp: ({ iosAppId, iphoneSchema, iosAppDownloadUrl, androidSchema, androidAppDownloadUrl }) => {
    if (navigator.userAgent.match(/(iPhone|iPod|iPad);?/i)) {
      // IPhone
      let loadDateTime = new Date()
      window.setTimeout(function () {
        let timeOutDateTime = new Date()
        if (timeOutDateTime - loadDateTime < 5000) {
          window.location = iosAppDownloadUrl.replace('@appId@', iosAppId) // IOS App 下载地址
        } else {
          window.close()
        }
      }, 25)
      window.location = iphoneSchema // IOS App 协议
    } else if (navigator.userAgent.match(/android/i)) {
      // Android
      try {
        window.location = androidSchema // Android App 协议
        setTimeout(function () {
          window.location = androidAppDownloadUrl // Android App 下载地址
        }, 500)
      } catch (e) {
        console.error(e)
      }
    }
  },
}

export default Utils
