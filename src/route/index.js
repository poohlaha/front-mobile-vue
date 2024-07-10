// import Vue from 'vue'
// import VueRouter from 'vue-router'
import routes from './router'

// 通过CDN引入VueRouter
window.Vue.use(window.VueRouter)

const router = new window.VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
})

// 解决app路由模块无法加载的问题
router.onError(error => {
  console.log('error', error)
  const pattern = /^(Loading chunk )[a-zA-Z]+( failed)/g
  const isChunkLoadFailed = error.message.match(pattern)
  if (isChunkLoadFailed) {
    location.reload()
  }
})

// 解决添加重复路由的问题
const routerPush = window.VueRouter.prototype.push
window.VueRouter.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(error => error)
}

// 添加标题
router.beforeEach((to, from, next) => {
  const title = to.meta?.title
  if (title) {
    document.title = title
  }
  next()
})

// 重写路由 push, 用于同一路由不同参数跳转
const originalPush = window.VueRouter.prototype.push
window.VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

export default router
