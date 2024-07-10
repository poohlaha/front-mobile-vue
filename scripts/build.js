const { WebpackCompiler } = require('@bale-tools/mutate-service')
const MutateVersion = require('@bale-tools/mutate-version')
const path = require('path')
const webpack = require('webpack')

const resolve = dir => path.join(__dirname, '../', dir)
const command = process.argv || []
const cmds = command.filter(x => !x.startsWith('--')) || []
const scripts = ['start', 'build', 'simulate', 'prod']

// script
function getScript(cmds = []) {
  if (cmds.length === 0) return scripts[1] // default dev
  if (cmds.includes(scripts[0])) return scripts[0]
  if (cmds.includes(scripts[1])) return scripts[1]
  if (cmds.includes(scripts[2])) return scripts[2]
  if (cmds.includes(scripts[3])) return scripts[3]
  return scripts[1]
}

// 获取 webpack 插件
function getWebpackPlugins() {
  const plugins = []

  // 添加全局 http
  plugins.push(
      new webpack.ProvidePlugin({
        $http: [resolve('src/communal/request/index.js'), 'default']
      })
  )

  return plugins
}

function copyFiles() {
  new MutateVersion({language: 'vue', babelImportPluginName: 'vant'}).copy()
}

function compiler() {
  WebpackCompiler({
    script: getScript(cmds),
    opts: {
      entry: './src/communal/app/index.js',
      plugins: getWebpackPlugins(),
      externals: {
        vue: 'Vue',
        'vue-router': 'VueRouter',
        Vuex: 'Vuex',
        axios: 'axios',
      },
      alias: {
        '@': resolve('src'),
        '@assets': resolve('src/assets'),
        '@communal': resolve('src/communal'),
        '@configs': resolve('src/communal/configs'),
        '@route': resolve('src/route'),
        '@views': resolve('src/views'),
        '@components': resolve('src/views/components'),
        '@modules': resolve('src/views/modules'),
        '@utils': resolve('src/communal/utils'),
        '@stores': resolve('src/views/stores'),
        '@pages': resolve('src/views/pages')
      },
      settings: {
        usePurgecssPlugin: false,
        usePwaPlugin: false,
        useMinimize: false,
        experiments: false,
        generateReport: false,
        compress: {
          enable: true,
          deleteOutput: true,
          suffix: '.zip'
        }
      },
    },
    done: () => {
      console.log('All Done.')
    }
  })
}

function run() {
  copyFiles()
  compiler()
}

run()

