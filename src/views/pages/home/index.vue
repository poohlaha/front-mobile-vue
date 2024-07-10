<template>
  <div class="home">
    <div class="hello">
      <Button>Welcome</Button>
    </div>
  </div>
</template>

<script>
import { Button } from 'vant'
import HTTP from '@stores/base'
export default {
  name: 'HomeView',
  components: {
    Button,
  },
  data() {
    return {
      msg: '',
    }
  },
  mounted() {
    HTTP.post({
      url: 'https://www.baidu.com',
      data: {},
      success: () => {
        console.log('success')
      },
      fail: () => {
        console.log('fail')
      },
    })
  },
  /*
  computed: {},
  created() {},
  mounted() {},
  methods: {},
  watch: {},
   */
}
</script>
