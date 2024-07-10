<template>
  <div :class="className">
    <slot v-if="success"></slot>
  </div>
</template>

<script>
/**
 * 延时加载组件
 */
export default {
  name: 'ComponentLazy',
  props: {
    time: {
      type: Number,
      default: 0,
    },
    className: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      success: false,
    }
  },

  created() {
    this.init()
  },

  methods: {
    init() {
      setTimeout(() => {
        this.success = true
      }, this.time)
    },
  },
}
</script>
