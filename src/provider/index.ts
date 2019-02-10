/**
 * Created by liuxi on 2019/01/31.
 */
import { Option } from '../../typings/provider'
import { Service } from './service'
import { Zookeeper } from './zookeeper'
import { Server } from './server'
import * as _ from 'lodash'
import { Context } from './context'
import { compose } from '../common/util'
import { ServiceNotFound } from './exception'

const debug = require('debug')('dubbo:provider:index')

class Provider extends Zookeeper {
  services: Service[]
  option: Option
  server: Server
  middleware: Function[]

  constructor (option: Option) {
    super(option)
    this.services = []
    this.middleware = []
    this.option = _.merge({
      executes: 1000,
      version: '2.5.3.6',
      zookeeper: {
        sessionTimeout: 30000,
        spinDelay: 1000,
        retries: 5
      }
    } as Option, option)
  }

  use (middleware: Function) {
    this.middleware.push(middleware)
  }

  addService (service: Service) {
    debug('添加服务')
    this.services.push(service)
  }

  invoke (context: Context) {
    debug(`客户端调用`)
    const service = this.services.find(s => s.option.interface === context.interface && s.option.version === context.version)
    if (service) {
      const fn = service.methods[context.method]
      if (typeof fn === 'function') {
        const fns = compose(...this.middleware, fn)
        fns(context).then(context.response).catch(context.response)
      } else {
        context.result = new ServiceNotFound(`调用服务不存在 ${context.interface}#${context.method}@${context.version} in [${this.services.map(s => s.option.interface)}]`)
        context.response()
      }
    } else {
      context.result = new ServiceNotFound(`调用服务不存在 ${context.interface}#${context.method}@${context.version} in [${this.services.map(s => s.option.interface)}]`)
      context.response()
    }
  }

  start (ready?: Function) {
    debug('启动服务')
    this.server = new Server(this.option.ip, this.option.port)
    this.server.on('done', () => {
      debug('开始启动 zookeeper')
      this.connect()
      this.server.on('invoke', this.invoke.bind(this))
    })
  }
}

export { Provider }
