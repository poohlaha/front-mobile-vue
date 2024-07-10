// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 页面请求发射器
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { fetch, fetchAll, getResponseErrorMessage } from './axios'
import { CONSTANT, SYSTEM } from '@configs/index'
import Utils from '@utils/utils'
import { setToken, Signature } from '@utils/sign'
// import axios from 'axios'
import { EXIT, PAGE_JUMP, TOAST } from '@utils/base'

/**
 * 发送请求
 * config :
 * {
 *    baseUrl: '', 根地址
 *    url: '', // 相对地址
 *    method: '', // 方法
 *    data: {}, // 数据
 *    requestType:  'request' // 'request' 'refresh', 'upload', 'none'
 *    queue: [], // 队列，当多个请求时使用
 *    ident: -1, // 0: 登录, 1: 退出登录, -1: 其他
 *    type: 'json', // 请求头类型, 默认为 json
 *    responseType: '',
 *    responseStream: false, // 返回结果是否是流
 *    headers: {}, // headers
 *    params: {message: ''}, // 传递参数
 *    success: function() {}, // 成功
 *    fail: function() {} // 失败
 * }
 */
export default class Request {
  static REQUEST_IDENTIFICATIONS = ['request', 'refresh', 'upload', 'none']
  static METHODS = ['GET', 'POST', 'PUT', 'DELETE']
  static BLOB = 'blob'
  static SUCCESS_CODE = 200
  static CONTENT_DISPOSITION = 'content-disposition'
  static FILENAME = 'FILENAME'
  static CONTENT_TYPE_NAME = 'content-type'

  /**
   * 发送请求
   * @param config 见类前注释
   */
  static async send(config = {}) {
    if (!config.url) return config.fail?.(null, config.params || {})

    // config.url = `${process.env.VUE_APP_API_ROOT}${config.url}`

    // TODO 判断用户是否登录, 如果不是登录判断token是否过期
    // if (Request.judgeTokenExpire(config)) return;

    // upload
    let requestType = Request.getRequestType(config)
    if (requestType === Request.REQUEST_IDENTIFICATIONS[2] || config.responseStream) {
      config.responseType = Request.BLOB
    }

    return await Request.request(config)
  }

  /**
   * 获取请求数据, headers统一在axios过滤器中处理
   * @param config 见类前注释
   */
  static getRequestHeader(config = {}) {
    let url = config.url

    // 判断是否需要加密
    let data = config.data || {}

    if (SYSTEM.NEED_ENCRYPT) {
      data = Signature.encrypt(data)
    }

    return {
      method: config.method || Request.METHODS[1],
      url,
      data,
      responseType: config.responseType,
      baseURL: config.baseUrl || process.env.VUE_APP_API_ROOT,
      headers: config.headers || {},
    }
  }

  /**
   * 判断token是否过期
   * @param config 见类前注释
   */
  static judgeTokenExpire(config = {}) {
    if (config.ident === undefined || config.ident === null) config.ident = -1
    if (config.ident !== -1) return false

    let token = Utils.getLocal(`${SYSTEM.OPEN_ID}_${SYSTEM.LOCAL_TOKEN}`)
    if (!token) {
      // 登录过期
      PAGE_JUMP.toLoginPage({ text: CONSTANT.TOKEN_EXPIRED_ERROR })
      return true
    }

    return false
  }

  /**
   * 获取请求标识
   * @param config 见类前注释
   */
  static getRequestType(config = {}) {
    if (!config) return Request.REQUEST_IDENTIFICATIONS[0]
    return (config && config.requestType) || Request.REQUEST_IDENTIFICATIONS[0]
  }

  /**
   * 请求数据
   * @param config 见类前注释
   */
  static async request(config = {}) {
    let options = Request.getRequestHeader(config)

    // 显示Loading条
    if (Request.getRequestType(config) === Request.REQUEST_IDENTIFICATIONS[0]) {
      TOAST.show(CONSTANT.LOADING, 1, false, 0) // loading
    }

    try {
      let res = await fetch(options)
      if (res.status === Request.SUCCESS_CODE) {
        return await Request.getResponseData(config, res)
      } else {
        console.error(res)
        return config.fail?.(res, config.params || {})
      }
    } catch (e) {
      console.error(e)
      TOAST.show(CONSTANT.ERROR_MESSAGE)
      return config.fail?.(e, config.params || {})
    }
  }

  /**
   * 获取返回数据
   * @param config 见类前注释
   * @param res 返回的结果, JSON对象
   */
  static getResponseData(config = {}, res = {}) {
    // 隐藏 loading 条
    if (Request.getRequestType(config) === Request.REQUEST_IDENTIFICATIONS[0]) {
      TOAST.hide()
    }

    try {
      if (!res.data) {
        return config.success?.(null, config.params || {})
      }

      // 返回流
      if (config.responseStream) {
        return Request.downloadFile(config, res)
      }

      let resData = null
      if (Request.isString(res.data)) {
        try {
          resData = JSON.parse(res.data)
        } catch (e) {
          resData = null
        }
      } else {
        resData = res.data
      }

      if (!resData) {
        console.info('没有返回数据')
        TOAST.show(CONSTANT.ERROR_MESSAGE)
        return config.success?.(null, config.params || {})
      }

      // failed
      if (
        !Utils.isBlank(resData.code) &&
        String(resData.code).toLowerCase() !== '0' &&
        String(resData.code).toLowerCase() !== '200'
      ) {
        let error = getResponseErrorMessage(resData)
        // token 过期
        if (error.code === CONSTANT.TOKEN_EXPIRED_CODE) {
          PAGE_JUMP.toLoginPage({ text: CONSTANT.TOKEN_EXPIRED_ERROR })
        } else {
          TOAST.show(error.reason)
        }
        return config.fail?.(error, config.params || {})
      }

      // 判断是否需要弹出自定义message
      if (config.params && config.params.message) {
        TOAST.show(config.params.message)
      }

      let data = resData.data || resData.result || {}
      // 判断是否是登录和登出, 如果是登录, 则保存token, 登出则清除localStorage
      if (config.ident === 0) {
        // 登录
        setToken(res, config) // 保存token
      } else if (config.ident === 1) {
        // 登出
        EXIT.logout()
      }

      return config.success?.(data, resData, config.params || {})
    } catch (res) {
      console.error(res)

      // 超时
      if (res.errMsg) {
        if (res.errMsg.toLowerCase().indexOf('timeout') !== -1) {
          TOAST.show(CONSTANT.TIMEOUT_MESSAGE)
        }
      } else {
        TOAST.show(getResponseErrorMessage(res.data))
      }

      return config?.fail(res)
    }
  }

  /**
   * 文件下载
   */
  static downloadFile = (config = {}, res) => {
    if (!res) return config.fail?.({ code })
    const { contentType, fileName } = Request.getDownloadFileName(res)
    console.log(contentType, fileName)

    let code = 0
    try {
      Request.export(res.data, contentType, fileName)
      code = 200
    } catch (e) {
      console.log('文件下载失败')
      code = 500
    }

    return config.success?.({ code })
  }

  /**
   * 获取文件下载的文件名
   * @param res 返回的结果, JSON对象
   */
  static getDownloadFileName(res) {
    let fileName = ''
    let headers = res.headers || {}
    let contentType = headers[Request.CONTENT_TYPE_NAME]
    let contentDisposition = headers[Request.CONTENT_DISPOSITION]
    if (!contentDisposition) return { contentType, fileName }

    let arr = contentDisposition.split(';')
    if (arr.length === 0) return { contentType, fileName }

    try {
      arr.forEach(item => {
        if (item && item.indexOf('=') !== -1 && item.toUpperCase().indexOf(Request.FILENAME) !== -1) {
          let _arr = item.split('=')
          fileName = _arr[_arr.length - 1]
        }
      })
    } catch (e) {
      fileName = ''
    }

    return {
      contentType,
      fileName: decodeURI(fileName).replace(/"/g, ''),
    }
  }

  /**
   * 导出文件
   * @param body 内容
   * @param contentType 传输类型
   * @param fileName 文件名称
   */
  static export(body, contentType, fileName) {
    let blob = new Blob([body || ''], { type: contentType })
    // @ts-ignore
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // @ts-ignore
      window.navigator.msSaveOrOpenBlob(blob, fileName)
    } else {
      let a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  /**
   * get请求
   * @param config 见类前注释
   */
  static get(config = {}) {
    config.method = Request.METHODS[0]
    return Request.send(config)
  }

  /**
   * post请求
   * @@param config 见类前注释
   */
  static post(config = {}) {
    config.method = Request.METHODS[1]
    return Request.send(config)
  }

  /**
   * put请求
   * @param config 见类前注释
   */
  static put(config = {}) {
    config.method = Request.METHODS[2]
    return Request.send(config)
  }

  /**
   * delete请求
   * @param config 见类前注释
   */
  static delete(config = {}) {
    config.method = Request.METHODS[3]
    return Request.send(config)
  }

  /**
   * 多个请求
   * @param queue 多个 config 对象数组
   */
  static async all(queue = []) {
    if (!queue || queue.length === 0) return

    TOAST.show(CONSTANT.LOADING, 1, false, 0)

    let requests = []
    queue.map(item => {
      let request = Request.getRequestHeader(item)
      if (request) {
        requests.push(window.axios(request))
      }
    })

    let response = await fetchAll(requests)
    TOAST.hide()
    if (!response) return

    let error = response.error // 是否有错误
    let errors = response.errors || [] // 错误数组
    let responses = response.responses || [] // 返回的请求数据数组

    // 有错误时提示错误
    if (error) {
      let _error = errors.length > 0 ? errors[0] : {}
      if (_error.code === CONSTANT.TOKEN_EXPIRED_CODE) {
        PAGE_JUMP.toLoginPage({ text: CONSTANT.TOKEN_EXPIRED_ERROR })
      } else {
        TOAST.show(_error.message)
      }
      return
    }

    if (responses.length === 0 || responses.length !== queue.length) {
      TOAST.show(CONSTANT.ERROR_MESSAGE)
      return
    }

    for (let i = 0; i < queue.length; i++) {
      let request = queue[i]
      let res = responses[i]
      if (!res) continue

      if (res.config.url !== request.url) {
        res = Request.findResponseByUrl(request.url, responses)
      }

      if (!res) continue
      request.success?.(res.data?.data || null, res.data || {}, request.params || {})
    }
  }

  /**
   * 根据url查找返回的Response
   * @param url config中的url
   * @param responses axios多个返回结果
   */
  static findResponseByUrl = (url, responses = []) => {
    if (!url || responses.length === 0) return null
    for (let i = 0; i < responses.length; i++) {
      let response = responses[i]
      if (!responses || !response.config) continue
      if (response.config.url === url) return response
    }

    return null
  }

  /**
   * 判断是不是string类型
   * @param str 字符串
   */
  static isString(str) {
    return typeof str == 'string' && str.constructor === String
  }
}
