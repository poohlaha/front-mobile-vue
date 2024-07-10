// 更新, 结合 .updaterc 文件

const BaleUtils = require('@bale-tools/utils')
const path = require('path')
const fsExtra = require('fs-extra')
const _ = require('lodash')
const chalk = require('chalk')
const lineByLine = require('n-readlines')
const inquirer = require('inquirer')
const os = require('node:os');

const LOGGER_PREFIX = chalk.cyan('[Frame Updater]: ')

class Updater {

  constructor() {
    this.appRootDir = BaleUtils.Paths.getAppRootDir() || ''
    this.configFilePath = path.join(this.appRootDir, '.updaterc');
    this.updateDir = path.join(this.appRootDir, '.update')
    this.updateUrl = 'https://github.com/poohlaha/front-mobile-vue.git'
    this.updateProjectName = 'front-mobile-vue'
    this.init()
  }

  init() {
    // 读取配置文件
    this.readConfigFile()
    // 解析读取的配置
    this.analysisConfig()
  }

  // 读取 .updaterc 文件
  readConfigFile() {
    if (!fsExtra.pathExistsSync(this.configFilePath)) {
      console.log(LOGGER_PREFIX, chalk.magenta('根目录下不存在 `.updaterc` 文件 !'))
      return
    }

    const liner = new lineByLine(this.configFilePath)
    let dests = []
    let ignores = []

    let line
    while (line = liner.next()) {
      let _line = line.toString().trim()
      if (BaleUtils.Utils.isBlank(_line)) {
        continue
      }

      if (_line.startsWith('!')) {
        let _ignore = _line.substring(1, _line.length)
        ignores.push(_ignore)
      } else {
        dests.push(_line)
      }
    }

    this.dests = dests || []
    this.ignores = ignores || []
  }

  //  解析配置
  analysisConfig() {
    if (this.dests.length === 0 && this.ignores.length === 0) {
      console.log(LOGGER_PREFIX, chalk.magenta('没有要更新的文件 !'))
      return
    }

    // 过滤不存在的文件
    let dests = this.dests.filter(dest => fsExtra.pathExistsSync(path.resolve(this.appRootDir, dest)))
    let ignores = this.ignores.filter(ignore => fsExtra.pathExistsSync(path.resolve(this.appRootDir, ignore)))
    this.dests = dests
    this.ignores = ignores

    if (this.dests.length === 0 && this.ignores.length === 0) {
      console.log(LOGGER_PREFIX, chalk.magenta('没有要更新的文件 !'))
      return
    }

    let destFiles = []
    let ignoreFiles = []

    // 读取 dests 所有文件
    this.dests.forEach(dest => {
      if (BaleUtils.Paths.isDir(dest)) { // 目录
        destFiles = destFiles.concat(BaleUtils.Paths.getFileList(dest) || [])
      } else {
        destFiles.push(dest)
      }
    })

    // 读取 ignores 所有文件
    this.ignores.forEach(ignore => {
      if (BaleUtils.Paths.isDir(ignore)) { // 目录
        ignoreFiles = ignoreFiles.concat(BaleUtils.Paths.getFileList(ignore) || [])
      } else {
        ignoreFiles.push(ignore)
      }
    })

    this.destFiles = destFiles || []
    this.ignoreFiles = ignoreFiles || []

    if (this.destFiles.length === 0 && this.ignoreFiles.length === 0) {
      console.log(LOGGER_PREFIX, chalk.magenta('没有要更新的文件 !'))
      return
    }

    let updateFiles = []
    // 合并文件，去除 ignore 文件
    this.destFiles.map((dest = '') => {
      let _dest = dest.trim()
      if (!this.ignoreFiles.includes(_dest)) {
        updateFiles.push(_dest)
      }
    })

    this.updateFiles = updateFiles || []
  }

  // 手动更新, 则直接把文件放到 .update 目录
  handUpdate(projectDir) {
    console.log(LOGGER_PREFIX, '开始获取文件更新 ...')
    const fileList = BaleUtils.Paths.getFileList(projectDir) || []
    let count = 0
    if (fileList.length > 0) {
      let updatePath = path.resolve(this.updateDir, '.new')
      BaleUtils.Paths.cleanDir(updatePath, true)
      for(let file of fileList) {
        let _file = (file || '').trim()
        // 文件不存在, 跳过
        if (!fsExtra.pathExistsSync(_file)) {
          continue
        }

        // 不包含, 拷贝到新的目录
        let relativePath = _file.replace(projectDir, '') || ''
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1, relativePath.length)
        } else if (relativePath.startsWith('\\')) {
          relativePath = relativePath.substring(2, relativePath.length)
        }

        if(this.updateFiles.includes(relativePath)) {
          fsExtra.copySync(_file, path.resolve(updatePath, relativePath))
          count++
        }
      }

      // 拷贝 package.json
      fsExtra.copySync(path.join(this.updateDir, this.updateProjectName, 'package.json'), path.join(updatePath, 'package.json'))
      // 清空原来目录
      BaleUtils.Paths.cleanDir(path.join(this.updateDir, this.updateProjectName), false)
      // 拷贝到原始目录
      fsExtra.copySync(updatePath, path.join(this.updateDir, this.updateProjectName))
      // 删除临时目录
      BaleUtils.Paths.cleanDir(updatePath, false)
    }

    console.log(LOGGER_PREFIX, `获取更新文件成功, 文件个数: ${chalk.magenta(count + 1)}, 路径: ${chalk.magenta(projectDir)}`)
  }


  async updater(flag = false) {
    if (this.updateFiles.length === 0) {
      console.log(LOGGER_PREFIX, chalk.magenta('没有要更新的文件 !'))
      return
    }

    // 清空目录, 目录不存在则创建
    BaleUtils.Paths.cleanDir(this.updateDir, true)

    try {
      // 从 git 上拉取代码
      const gitTool = new BaleUtils.GitTool(true, this.updateDir)
      await gitTool.pullProject({ url: this.updateUrl })

      // 复制文件
      let projectDir = gitTool.getCacheProjectDir()
      // 项目不存在, 直接清空目录
      if (!fsExtra.pathExistsSync(projectDir)) {
        BaleUtils.Paths.cleanDir(this.updateDir, false)
        return
      }

      // 手动, 则直接把文件放到 .update 目录
      if (!flag) {
        return this.handUpdate(projectDir)
      }

      console.log(LOGGER_PREFIX, '开始文件更新 ...')
      let count = 0
      // 拷贝文件
      this.updateFiles.forEach((file = '') => {
        let _file = file.trim()
        let projectFile = path.resolve(projectDir, _file)
        // 文件存在, 则直接拷贝
        if (fsExtra.pathExistsSync(projectFile)) {
          console.log(LOGGER_PREFIX, chalk.magenta(_file))
          fsExtra.copySync(projectFile, path.resolve(this.appRootDir, _file))
          count++
        }
      })

      // 更新 package.json
      const hasWrite = this.updatePackageJson(path.join(projectDir, 'package.json'))
      if (hasWrite) {
        count++
        BaleUtils.Paths.install()  // install
      }

      console.log(LOGGER_PREFIX, `更新文件成功, 个数: ${chalk.magenta(count)}`)
      BaleUtils.Paths.cleanDir(this.updateDir, false)
    } catch (e) {
      console.log(LOGGER_PREFIX, e)
      BaleUtils.Paths.cleanDir(this.updateDir, false)
    }
  }

  // 更新 package.json 文件
  updatePackageJson(destPackageJson) {
    if (!fsExtra.pathExistsSync(destPackageJson)) {
      console.log(LOGGER_PREFIX, chalk.magenta('框架中 package.json 不存在, 无法更新 !'))
      return false
    }

    let appPackageJson = path.join(this.appRootDir, 'package.json')
    if (!fsExtra.pathExistsSync(appPackageJson)) {
      console.log(LOGGER_PREFIX, chalk.magenta('项目中 package.json 不存在, 无法更新 !'))
      return false
    }

    let descPackage = require(destPackageJson)
    let appPackage = require(appPackageJson)

    const rewriteDependencies = (dependencies = {}, configDependencies = {}) => {
      let hasWrite = false
      for (let key in configDependencies) {
        // 判断依赖和版本号是否一致, 如果不一致升级版本
        if (!dependencies[key] || dependencies[key] !== configDependencies[key]) {
          dependencies[key] = configDependencies[key]
          hasWrite = true
        }
      }

      return hasWrite
    }

    let hasDependenciesWrite = rewriteDependencies(descPackage.dependencies, appPackage.dependencies || {})
    let hasDevDependenciesWrite = rewriteDependencies(descPackage.devDependencies, appPackage.devDependencies || {})
    let flag = hasDependenciesWrite || hasDevDependenciesWrite

    // judge `husky` and `lint-staged`
    const appPackageHusky = appPackage['husky'] || {}
    const appPackageLintStaged = appPackage['lint-staged'] || {}
    let configFlag = _.isEqual(appPackageHusky, descPackage['husky']) && _.isEqual(appPackageLintStaged, descPackage['lint-staged'])
    const hasWrite = flag || !configFlag

    if (hasWrite) {
      console.log(LOGGER_PREFIX, '开始更新 `package.json` ')
      appPackage['husky'] = descPackage['husky'] || {}
      appPackage['lint-staged'] = descPackage['lint-staged'] || {}
      fsExtra.writeFileSync(path.join(this.appRootDir, 'package.json'), JSON.stringify(appPackage, null, 2) + os.EOL)
      console.log(LOGGER_PREFIX, '更新 `package.json` 成功 !')
    }

    return hasWrite
  }

  // 更新文件
  async update() {
    return inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'needHand',
          message: '是否直接覆盖?',
          default: false, // default to help in order to avoid clicking straight through
        },
      ])
      .then((result = {}) => {
        console.log(result.needHand)
        this.updater(result.needHand)
      })
  }
}

module.exports = new Updater().update()
