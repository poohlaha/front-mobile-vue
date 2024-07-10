// import Vue from 'vue'
import VConsole from 'vconsole'
import App from './index.vue'
import store from '@stores/index'

import FastClick from 'fastclick'
import 'lib-flexible'
import '@assets/styles/skin/index.less'

// fastclick
FastClick.attach(document.body)
// 解决移动端输入框无法点击事件
FastClick.prototype.focus = function (targetElement) {
  let length
  if (
    targetElement.setSelectionRange &&
    targetElement.type.indexOf('date') !== 0 &&
    targetElement.type !== 'time' &&
    targetElement.type !== 'month'
  ) {
    length = targetElement.value.length
    targetElement.focus()
    targetElement.setSelectionRange(length, length)
  } else {
    targetElement.focus()
  }
}

if (process.env.NODE_ENV !== 'local' && process.env.NODE_ENV !== 'production') {
  const vConsole = new VConsole()
  document.querySelector('.vc-switch').innerHTML = '调试'
  window.Vue.use(vConsole)
}

window.Vue.config.productionTip = false

let options = {
  store,
  render: h => h(App),
}

if (process.env.VUE_APP_MULTI_PAGE_PACK !== 'true') {
  const router = require('../../route')
  options.router = router.default
}

new window.Vue(options).$mount('#app')
