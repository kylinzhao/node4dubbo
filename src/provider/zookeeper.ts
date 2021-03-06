/**
 * Created by liuxi on 2019/02/01.
 */
import * as common from '../common/zookeeper'
import { Option } from '../../typings/provider'
import { State } from 'node-zookeeper-client'
import { EventEmitter } from 'events'
import { stringify, parse } from 'querystring'
import { Service } from './service'
import { ip } from '../common/util'
import path = require('path')

const debug = require('debug')('dubbo:provider:zookeeper')

const interfaces: { [x: string]: number } = {}

class Zookeeper extends EventEmitter {
  client: common.Zookeeper
  option: Option
  services: Service[]

  constructor (option: Option) {
    super()
    this.option = option
  }

  connect () {
    const {zookeeper} = this.option
    debug('开始连接zookeeper', zookeeper.address)
    this.client = new common.Zookeeper(zookeeper.address, zookeeper)
    this.client.on('state', this.state.bind(this))
  }

  state (state: State) {
    debug('zookeeper 状态改变', state)
    switch (state) {
      case State.SYNC_CONNECTED:
        debug('zookeeper 已连接开始注册 provider', this.option.zookeeper.address)
        this.createProvider()
        break
      case State.CONNECTED_READ_ONLY:
        debug('zookeeper 连接到只读服务器 抛出错误', this.option.zookeeper.address)
        this.emit('error', state)
        break
      case State.DISCONNECTED:
        debug('zookeeper 连接断开', this.option.zookeeper.address)
        this.emit('error', state, {
          option: this.option
        })
        break
      case State.AUTH_FAILED:
        debug('zookeeper 连接认证失败', this.option.zookeeper.address)
        this.emit('error', state, {
          option: this.option
        })
        break
    }
  }

  createQuery (service: Service) {
    const {
      application,
      executes,
      timeout,
      version: dubbo,
      environment,
      organization,
      owner,
      revision
    } = this.option

    const {
      option,
      methods
    } = service

    const {interface: _interface, version} = option

    const query = {
      anyhost: true,
      application: application.name,
      'application.version': application.version,
      'default.executes': executes,
      'default.threads': executes,
      'default.timeout': timeout,
      dubbo,
      environment,
      interface: _interface,
      methods: Object.keys(methods).join(),
      organization,
      owner,
      pid: process.pid,
      revision,
      side: 'provider',
      timestamp: Date.now(),
      version: version
    }
    return stringify(query)
  }

  createProvider () {
    const {
      port,
      zookeeper
    } = this.option
    /**
     * 相同interface不同版本则自动生成path后缀
     * @param name
     */
    const getInterface = (name: string): string => {
      let count = interfaces[name]
      if (count) {
        count++
        interfaces[name] = count
        return name + count
      } else {
        interfaces[name] = 1
        return name
      }
    }

    this.services.forEach(async service => {
      const query = this.createQuery(service)
      const {interface: _interface} = service.option
      // const provider = `dubbo://ip:port/path?query`
      const provider = `dubbo://${ip()}:${port}/${getInterface(_interface)}?${query}`

      const registryPath = `/${zookeeper.path}/${_interface}/providers/${encodeURIComponent(provider)}`
      debug('zookeeper 注册provider', registryPath)
      this.createPath(registryPath)
    })
  }

  /**
   * 自动创建关联节点
   * @param registryPath
   */
  async createPath (registryPath: string) {
    debug('zookeeper 节点', registryPath)
    this.client.exists(registryPath).catch(() => {
      const basePath = path.dirname(registryPath)
      debug('zookeeper 节点 不存在', registryPath)
      return this.client.exists(basePath).catch(async () => {
        debug('zookeeper basePath 节点 不存在', basePath)
        const paths = basePath.split('/').filter(i => i)
        for (let i = 1, length = paths.length; i <= length; i++) {
          debug('zookeeper 创建根节点', paths.slice(0, i).join('/'))
          /**
           * ps: zookeeper 临时节点不允许创建子节点 所以有子节点的父节点都只能创建固定节点
           * pps: 后期可能会增加清理api 专门清理zookeeper节点污染的问题
           */
          await this.client.createPath('/' + paths.slice(0, i).join('/'), common.CreateMode.PERSISTENT)
        }
        await this.client.createPath(`/${paths.slice(0, paths.length - 1).join('/')}/consumers`, common.CreateMode.PERSISTENT)
        await this.client.createPath(`/${paths.slice(0, paths.length - 1).join('/')}/configurators`, common.CreateMode.PERSISTENT)
        await this.client.createPath(`/${paths.slice(0, paths.length - 1).join('/')}/routers`, common.CreateMode.PERSISTENT)
        debug(`zookeeper 创建关联节点完毕 consumers、configurators、routers、providers`)
      })
    }).then(() => {
      debug('zookeeper 注册临时服务子节点')
      return this.client.createPath(registryPath)
    })
  }
}

export { Zookeeper }
