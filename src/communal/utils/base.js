import Utils from '@utils/utils'
import { CONSTANT, SYSTEM } from '@configs/index'
import { RouterUrls } from '@route/urls'
import { Dialog, Toast } from 'vant'

// 退出相关
const EXIT = {
  /**
   * 退出微信
   */
  exitWX: () => {
    STORAGE.clearUserInfo()
    if (window.WeixinJSBridge) {
      setTimeout(function () {
        //安卓
        document.addEventListener(
          'WeixinJSBridgeReady',
          function () {
            window.WeixinJSBridge.call('closeWindow')
          },
          false
        )
        //ios
        window.WeixinJSBridge.call('closeWindow')
      }, 300)
    } else {
      EXIT.logout()
    }
  },

  /**
   * 退出登陆
   * @param text 提示文字
   * @param redirectUrl 重定向url
   */
  logout: (text = '', redirectUrl = '') => {
    STORAGE.clearUserInfo()
    PAGE_JUMP.toLoginPage({ text, redirectUrl })
  },
}

// 存储相关
const STORAGE = {
  /**
   * 清除用户信息
   */
  clearUserInfo: () => {
    // 删除用户信息
    Utils.removeLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.USER_TOKEN}`)
    Utils.removeLocal(`${SYSTEM.OPEN_ID}_${CONSTANT.TAB_INDEX_KEY}`)

    // 删除Token
    Utils.removeLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.LOCAL_TOKEN}`)
    Utils.clearSessionStorage()
  },

  /**
   * 清除所有信息
   */
  clear: () => {
    Utils.clearLocalStorage()
    Utils.clearSessionStorage()
  },
}

// 页面跳转相关
const PAGE_JUMP = {
  /**
   * 跳转到资金账号登录页面
   * @param text 提示文字
   * @param url 跳转url
   * @param redirectUrl 重定向url
   * @param isReplace 是否替换
   */
  toLoginPage: ({ text = '', url = '', redirectUrl = '', isReplace = false }) => {
    if (!Utils.isBlank(text)) TOAST.show(text, 1)
    let { beforeAddressUrl, addressUrl } = ADDRESS.getAddress()
    if (!Utils.isBlank(addressUrl) && addressUrl.startsWith('/')) {
      addressUrl = addressUrl.substr(1, addressUrl.length)
    }

    if (Utils.isBlank(url)) url = RouterUrls.PERSONAL.ACCOUNT_LOGIN.URL
    url = `${beforeAddressUrl}${url}?redirectUrl=${Utils.encrypt(
      encodeURIComponent(redirectUrl || addressUrl || window.location.href)
    )}`

    const getUrl = () => (isReplace ? window.location.replace(url) : (window.location.href = url))
    !Utils.isBlank(text) ? setTimeout(() => getUrl(), 500) : getUrl()
  },

  /**
   * 通过window跳转
   * @param url 路径
   * @param needPrefix 是否需要前缀
   * @param isReplace 是否替换
   */
  toWindowPage(url, needPrefix = false, isReplace = false) {
    if (Utils.isBlank(url)) return
    if (needPrefix) {
      let { beforeAddressUrl } = ADDRESS.getAddress()
      url = beforeAddressUrl + url
    }
    if (isReplace) {
      window.location.replace(url)
    } else {
      window.location.href = url
    }
  },

  /**
   * 页面跳转回去
   * @param callback 回调函数
   * @param failedCallback 失败跳转
   */
  toPageBack(callback, failedCallback) {
    const { param } = ADDRESS.getAddress()
    const redirectUrlStr = 'redirectUrl='
    const index = param.indexOf(redirectUrlStr)
    if (index === -1) {
      failedCallback?.()
    } else {
      const redirectUrl = param.substr(index + redirectUrlStr.length, param.length)
      callback?.(Utils.decrypt(decodeURIComponent(redirectUrl)))
    }
  },

  /**
   * replace跳转
   * @param url 地址
   * window.history.replaceState，其替换的url，必须和当前页面url是同源的，否则不生效
   */
  locationReplace(url = '') {
    if (window.history.replaceState) {
      window.history.replaceState(null, document.title, url)
      window.history.go(0)
    } else {
      window.location.replace(url)
    }
  },
}

// 地址栏相关
const ADDRESS = {
  /**
   * 根据 window.location.href 获取前缀和后缀 URL
   * @param url url地址，可以以https|http开头
   */
  getAddress: (url = '') => {
    let address = url || window.location.href
    const addressReg = /^(https?:\/\/)([0-9a-z.]+)(:[0-9]+)?([/0-9a-z.]+)(\/#)$/
    if (address.substr(address.length - 1, address.length) === '/') {
      address = address.substr(0, address.length - 1)
    }

    // 如果只有协议和端口
    if (addressReg.test(address)) {
      console.log('address:', '')
      console.log('beforeAddressUrl:', address)
      return {
        addressUrl: '',
        beforeAddressUrl: address,
      }
    }

    // 判断是否有?
    const qIndex = address.indexOf('?')
    let param = ''
    if (qIndex !== -1) {
      const addressNoParamUrl = address.substr(0, qIndex)
      param = address.substr(qIndex, address.length)
      address = addressNoParamUrl
    }

    // 判断最后一个字符是否是 `\`
    const lastChar = address.substr(address.length - 1, address.length)
    if (lastChar.endsWith('/') || lastChar.endsWith('\\')) {
      address = address.substr(0, address.length)
    }

    const lastIndex = address.lastIndexOf('/')
    let beforeAddressUrl = address.substr(0, lastIndex) // 前缀
    const spec = beforeAddressUrl.indexOf('#') // #
    if (spec !== -1) {
      beforeAddressUrl = beforeAddressUrl.substr(0, spec) + '#'
    }
    const addressUrl = address.substr(lastIndex, address.length) // 后缀
    console.log('addressUrl:', addressUrl)
    console.log('beforeAddressUrl:', beforeAddressUrl)
    console.log('param:', param)
    return {
      addressUrl,
      beforeAddressUrl,
      param,
      params: ADDRESS.getUrlString(param),
    }
  },

  /**
   * 获取 URL 参数
   * @param url url地址
   */
  getUrlString: (url = '') => {
    if (!url) return {}

    const obj = {}
    const getQueryParams = (url = '') => {
      const params = {}
      if (!url) return params

      const spec = '?'
      const specIndex = url.indexOf(spec)
      if (specIndex === -1) return params

      url = url.substring(specIndex, url.length)
      const t = url.substring(0, 1)
      const query = t === '?' ? url.substring(1, url.length).split('&') : url.split('&')
      if (!query.length) return null
      query.forEach((item = '') => {
        if (item) {
          const data = item.split('=')
          params[data[0]] = data[1] || ''
        }
      })

      return params
    }
    // 判断是否有redirectUrl
    const redirectStr = 'redirectUrl='
    const redirectIndex = url.indexOf(redirectStr)
    if (redirectIndex !== -1) {
      const item = url.substr(redirectIndex + redirectStr.length, url.length)
      const prefixUrl = url.substr(0, redirectIndex)
      obj[redirectStr.substr(0, redirectStr.length - 1)] = item
      const otherParams = getQueryParams(prefixUrl)
      return {
        ...obj,
        ...otherParams,
      }
    }

    return getQueryParams(url)
  },

  /**
   * 根据名称获取浏览器参数
   * @param name 参数名字
   */
  getAddressQueryString: (name = '') => {
    if (!name) return null
    let after = window.location.search
    after = after.substr(1) || window.location.hash.split('?')[1]
    if (!after) return null
    if (after.indexOf(name) === -1) return null
    const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
    const r = decodeURI(after).match(reg)
    if (!r) return null
    return r[2]
  },
}

// 用户相关
const USER = {
  /**
   * 获取用户信息
   * 通过OPEN_ID 和 SYSTEM.USER_TOKEN
   */
  getUserInfo: () => Utils.getLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.USER_TOKEN}`) || {},

  /**
   * 保存用户信息
   * 通过OPEN_ID 和 SYSTEM.USER_TOKEN、SYSTEM.TOKEN_NAME
   * @param userInfo 用户数据, JSON对象
   */
  setUserInfo: (userInfo = {}) => {
    if (Utils.isObjectNull(userInfo)) return
    const token = userInfo[SYSTEM.TOKEN_NAME] // 从用户信息中获取 TOKEN
    delete userInfo[SYSTEM.TOKEN_NAME]

    // 设置用户信息
    Utils.removeLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.USER_TOKEN}`)
    const phoneInfo = {
      token: userInfo.loginToken || '',
      account: userInfo.mobile || '',
      show: userInfo.mobileShow || '',
    }
    const accountInfo = {
      token: userInfo.fundAccountToken || '',
      account: userInfo.fundAccount || '',
      show: userInfo.fundAccountShow || '',
    }
    Utils.setLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.USER_TOKEN}`, JSON.stringify({ phoneInfo, accountInfo }))

    // 保存 TOKEN
    Utils.removeLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.LOCAL_TOKEN}`)
    Utils.setLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.LOCAL_TOKEN}`, token)
  },

  /**
   * 设置资金账号/手机号信息
   */
  setAccountInfo: (info = {}, name = '') => {
    if (Utils.isBlank(name)) return
    const userInfo = USER.getUserInfo() || {}
    const accountInfo = userInfo[name] || {}
    accountInfo.token = info.token || ''
    accountInfo.account = info.account || ''
    accountInfo.show = info.show || ''
    userInfo[name] = accountInfo
    Utils.removeLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.USER_TOKEN}`)
    Utils.setLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.USER_TOKEN}`, JSON.stringify(userInfo))
  },

  /**
   * 设置openId
   * @param openId 用户openId
   */
  setOpenId: (openId = '') => {
    if (Utils.isBlank(openId)) return
    Utils.removeLocal(SYSTEM.OPEN_ID)
    Utils.setLocal(SYSTEM.OPEN_ID, openId || '')
  },

  /**
   * 获取openId
   */
  getOpenId: () => {
    let openId = ADDRESS.getAddressQueryString('openId') || ''
    if (Utils.isBlank(openId)) {
      openId = Utils.getLocal(SYSTEM.OPEN_ID) || ''
    } else {
      USER.setOpenId(openId)
    }
    return openId
  },
}

// Toast
const TOAST = {
  /**
   * Toast 弹出提示
   * @param message -- 内容
   * @param duration -- 时间 0 为不关闭
   * @param type --- 1 默认提示 2 成功 3 失败 4 loading
   * @param needTime -- 是否延迟加载
   * @param maskClickable -- 背景是否可点击
   * @param className --- 遮罩层样式
   * @param onAfterClose -- 关闭函数
   */
  show: (
    message = '',
    type = 1,
    needTime = false,
    duration = 2000,
    maskClickable = true,
    className = '',
    onAfterClose = null
  ) => {
    const getToast = () => {
      if (type === 2) {
        // 成功
        Toast({
          type: 'success',
          message,
          forbidClick: maskClickable,
          duration,
          onClose: onAfterClose,
        })
      } else if (type === 3) {
        // 失败
        Toast({
          type: 'fail',
          message,
          forbidClick: maskClickable,
          duration,
          onClose: onAfterClose,
        })
      } else if (type === 4) {
        // loading
        Toast({
          type: 'loading',
          message: message || CONSTANT.LOADING,
          forbidClick: maskClickable,
          loadingType: 'spinner',
          duration,
          onClose: onAfterClose,
        })
      } else {
        Toast({
          type: 'html',
          message,
          forbidClick: maskClickable,
          duration,
          onClose: onAfterClose,
        })
      }
    }

    needTime ? setTimeout(() => getToast(), 350) : getToast()
  },

  /**
   * alert
   * @param title 标题
   * @param message 文字
   * @param confirmButtonText 确实文字
   * @param showCancelButton 是否显示取消按钮
   * @param callback 回调函数
   * @param className 自定义类名
   * @param type 类型 1: alert 2: confirm
   */
  alert: ({ title = '系统提示', message, confirmButtonText, showCancelButton, callback, className, type = 1 }) => {
    const dialogName = type === 2 ? 'confirm' : 'alert'
    Dialog[dialogName]({
      title,
      message,
      confirmButtonText,
      showCancelButton,
      className,
    })
      .then(() => {
        callback?.()
      })
      .catch(() => {
        // on cancel
      })
  },

  /**
   * 隐藏 Toast 弹出提示
   */
  hide: () => {
    Toast.clear()
  },
}

// 公共模块相关
const COMMON = {}

export { EXIT, STORAGE, PAGE_JUMP, ADDRESS, USER, TOAST, COMMON }
