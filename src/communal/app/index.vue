<template>
  <div id="app" class="h100">
    <keep-alive v-if="keepAlive">
      <router-view class="keep-alive" :key="$route.fullPath"></router-view>
    </keep-alive>
    <router-view v-if="!keepAlive" :key="$route.fullPath"></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    ...window.Vuex.mapState({
      skin: state => state.common.skin,
    }),
  },
  data() {
    return {
      keepAlive: false,
    }
  },
  created() {
    this.$router.onReady(() => {
      this.keepAlive = this.$route?.meta?.keepAlive
      console.log('keepAlive:', this.keepAlive)
    })
    document.body.classList.add(this.skin)
  },
}
</script>
