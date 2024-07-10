import { CONSTANT } from '@configs/index'

const state = {
  language: CONSTANT.LANGUAGES[0], // 默认中文
  skin: CONSTANT.SKINS[0], // 默认orange
}

const mutations = {
  /**
   * 设置对象属性
   * {
   *     property: 'hospitalListState',
   *     name: 'finished',
   *     data: false
   * }
   */
  setObjectProperty(state = {}, param = {}) {
    if (!param.property) return
    state[param.property][param.name] = param.data
  },

  /**
   * 设置单个属性
   */
  setProperty(state = {}, param = {}) {
    state[param.name] = param.data
  },
}

const actions = {}
const getters = {}

// 分模块
export default {
  name: 'common',
  state,
  mutations,
  actions,
  getters,
}
