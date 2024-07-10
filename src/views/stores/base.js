/**
 * 发送请求
 */
// eslint-disable-next-line no-undef
const post = (options = {}) => $http.post(options)

/**
 * get 请求
 */
// eslint-disable-next-line no-undef
const get = (options = {}) => $http.get(options)

/**
 * 批量发送
 */
// eslint-disable-next-line no-undef
const sendBatch = (queue = []) => $http.all(queue)

export default {
  post,
  get,
  sendBatch,
}
