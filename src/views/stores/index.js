// import Vue from 'vue'
// import Vuex from 'vuex'

// 缓存模块名
let storeModulesName = []
// 读取store模块，返回组装好的vuex modules
const MODULES = (r => {
  let modules = {}
  let keys = r.keys()
  if (!keys || keys.length === 0) return []

  keys.forEach(key => {
    let keyDefault = r(key).default
    storeModulesName.push(keyDefault.name)
    modules[keyDefault.name] = keyDefault
  })
  return modules
})(require.context('./', true, /^(.*)store\.js$/))

window.Vue.use(window.Vuex)

let store = new window.Vuex.Store({
  modules: MODULES,
})

export default store
