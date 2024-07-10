// import axios from 'axios'
import { CONSTANT } from '@configs/index'
import { setHeaders } from '@communal/utils/sign'

window.axios.defaults.timeout = CONSTANT.REQUEST_TIMEOUT // 请求超时时间
// axios.defaults.withCredentials = true; // 选项表明了是否是跨域请求

/**
 * 拦截发送请求
 */
window.axios.interceptors.request.use(
  (config = {}) => {
    config.headers = setHeaders(config) || {} // 设置请求头
    return config
  },
  (error = {}) => Promise.reject(error)
)

/**
 * 拦截响应
 */
window.axios.interceptors.response.use(
  (response = {}) => response,
  error => Promise.reject(error)
)

/**
 * 获取返回错误信息
 * @param data 返回的数据, JSON对象
 */
export function getResponseErrorMessage(data) {
  let reason = null
  let code = null
  try {
    if (!data) {
      reason = CONSTANT.ERROR_MESSAGE
    } else {
      reason = data.codeInfo || data.reason || data.message || data.msg || CONSTANT.ERROR_MESSAGE
      code = data.code
    }
  } catch (e) {
    reason = CONSTANT.ERROR_MESSAGE
  }

  return {
    reason,
    code: code || 500,
  }
}

/**
 * 发送请求
 * @param options
 */
export function fetch(options) {
  return new Promise((resolve, reject) => {
    window
      .axios(options)
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        reject(error)
      })
  })
}

/**
 * 批量发送请求
 * @param requests 多个axios配置
 */
export function fetchAll(requests = []) {
  return new Promise(resolve => {
    const res = window.axios.all(requests)
    res
      .then(
        window.axios.spread(function () {
          if (arguments.length === 0) return
          const responses = []
          const errors = []
          for (let response of arguments) {
            if (!response) continue

            if (response.status !== 200) {
              errors.push({
                code: 500,
                message: CONSTANT.ERROR_MESSAGE,
              })
              break
            }

            if (!response.data || response.data.code !== '0') {
              const error = getResponseErrorMessage(response.data || {}) || {}
              errors.push({
                code: error.code,
                message: error.reason,
              })
              break
            }

            responses.push(response)
          }

          resolve(
            errors.length > 0
              ? {
                  error: true,
                  errors,
                }
              : {
                  error: false,
                  responses,
                }
          )
        })
      )
      .catch(() => {
        // reject(error)
        resolve({
          error: true,
          errors: [
            {
              code: 500,
              message: CONSTANT.ERROR_MESSAGE,
            },
          ],
        })
      })
  })
}
