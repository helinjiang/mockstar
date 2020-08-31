import _ from 'lodash';
import MockModule from './MockModule';

/**
 * 构造函数
 *
 * @param [route] 需要处理的路由，只有匹配到这个路由，才会被处理
 * @param [routeExtra] 额外的路由匹配参数
 * @param [name] 名字
 * @param [description] 简要描述
 * @param [disable] 此mocker是否为禁用状态，一旦设置为 true，则将忽略该mocker，而是去请求现网
 * @param [defaultModule] 默认初始化时激活的 mock module 名字
 * @param [activeModule] 当前激活的 mock module 名字
 * @param [method] http 请求方式，包括 get(默认) 和 post
 * @param [plugin] 数据mock类型，包括 xhr(默认) 和 async
 * @param [priority] 管理后台列表中排序的权重，值越大则越排在前面
 * @param [tags] 管理后台用到的标签，用于过滤，字符串数组
 */
export interface MockerConfigOpt {
  route?: string;
  routeExtra?: Record<string, unknown>;
  description?: string;
  disable?: boolean;
  defaultModule?: string;
  activeModule?: string;
  method?: 'GET' | 'POST' | 'get' | 'post';
  plugin?: 'xhr' | 'async';
  priority?: number;
  tags?: string[];
}

export default class MockerConfig {
  // 名字，注意名字不能够再被修改，即忽略 config.name
  name: string;
  // 需要处理的路由，只有匹配到这个路由，才会被处理
  route: string;
  // 额外的路由匹配参数
  routeExtra: Record<string, unknown>;
  // 简要描述
  description: string;
  // 此mocker是否为禁用状态，一旦设置为 true，则将忽略该mocker，而是去请求现网
  // 该字段是可以被 CGI 修改的。
  disable: boolean;
  // 默认的的 mock module 名字
  defaultModule: string;
  // 当前激活的 mock module 名字
  // 该字段是可以被 CGI 修改的。因此优先使用配置项中的 activeModule，其次才是 defaultModule
  activeModule: string;
  // http 请求方式，包括 get(默认) 和 post
  method: 'GET' | 'POST' | 'get' | 'post';
  // 数据mock类型，包括 xhr(默认) 和 async
  plugin: 'xhr' | 'async';
  // 管理后台列表中排序的权重，值越大则越排在前面
  priority: number;
  // 管理后台用到的标签，用于过滤，字符串数组
  tags: string[];

  /**
   * 构造函数
   *
   * @param {String} handlerName 名字
   * @param {Object} config config.json 中的值
   * @param {Array} [mockModuleList] mock module 数组
   */
  constructor(handlerName: string, config?: MockerConfigOpt, mockModuleList?: MockModule[]) {
    this.name = handlerName;

    if (!config) {
      config = {};
    }

    this.route = config.route || '';

    this.routeExtra = config.routeExtra || {};

    // 可能route中不以 / 开头，此时需要增加之
    if (this.route && this.route.indexOf('/') !== 0) {
      this.route = '/' + this.route;
    }

    this.description = config.description || this.name;

    this.disable = config.disable || false;

    this.defaultModule = config.defaultModule || '';

    this.activeModule = config.activeModule || this.defaultModule;

    // 进一步校验 activeModule
    if (mockModuleList && mockModuleList.length) {
      const firstMockModuleName = mockModuleList[0].name;

      if (!this.activeModule) {
        // activeModule 如果不存在，则默认设置 mock module 列表中的第一个
        this.activeModule = firstMockModuleName;
      } else {
        // activeModule 如果存在，但并没有在新的列表中，有可能是改名或者删除了，则默认设置 mock module 列表中的第一个
        const activeItem = mockModuleList.filter(item => {
          return item.name === this.activeModule;
        })[0];

        if (!activeItem) {
          this.activeModule = firstMockModuleName;
        }
      }
    }

    this.method = config.method || 'GET';

    this.plugin = config.plugin || 'xhr';

    this.priority = config.priority || 0;

    this.tags = _.union(['全部'], config.tags || []);

    // 最后更新的时间
    // this.lastModified = Date.now();
  }

  update(opts: MockerConfigOpt): void {
    _.merge(this, opts);
  }
}
