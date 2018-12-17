const fs = require('fs');
const path = require('path');
const url = require('url');
const child_process = require('child_process');

//rewrite promise, bluebird is more faster
// require('babel-runtime/core-js/promise').default = require('bluebird');
global.Promise = require('bluebird');

// const babelCompileDirectory = require('babel-d');

const mockstarServer = require('./server');

const logger = require('./server/logger');
const mockstarLogger = logger.mockstarLogger();
const attentionLogger = logger.attentionLogger();

// 暴露一个全局log变量
global.mockstarLogger = mockstarLogger;
global.attentionLogger = attentionLogger;

class RunServer {
    /**
     * @param {Object} localServerConfig 配置项参数
     */
    constructor(localServerConfig) {
        if (!localServerConfig) {
            throw new Error('Invalid param!');
        }

        this.localServerConfig = localServerConfig;

        this.router = null;
        this.middleware = null;
        this.app = null;
        this.server = null;

        this.html = '';

    }

    /**
     * 启动服务
     *
     * @param {Function} callback 回调函数
     */
    start(callback) {
        const self = this;

        if (fs.existsSync(path.join(self.localServerConfig.rootPath, './namespace'))) {
            fs.readdir(path.join(self.localServerConfig.rootPath, './namespace'), (err, files) => {
                if (err) {
                    console.error(err);
                    self.localServerConfig.namespaceList = [];
                }
                let namespacearr = [];

                files.forEach(function (filename) {
                    namespacearr.push(filename);
                });

                self.localServerConfig.namespaceList = namespacearr;
                self._initBabel();
                self._initLog();

                self._createRouter();
                self._createMiddleware();
                self._createApp();
                self._createServer();
                self._startServer(callback);
            })
        } else {
            self.localServerConfig.namespaceList = [];
            self._initBabel();
            self._initLog();

            self._createRouter();
            self._createMiddleware();
            self._createApp();
            self._createServer();
            self._startServer(callback);
        }
    }

    /**
     * 停止服务
     * @param {Function} callback 回调函数
     */
    stop(callback) {
        this._stopServer(callback);
    }

    /**
     * 重启服务
     * @param {Function} callback 回调函数
     */
    restart(callback) {
        // 先停止
        this.stop(() => {
            // 再重新启动
            this.start(callback);
        });
    }

    /**
     * babel 编译等预处理
     * @private
     */
    _initBabel() {
        // babelCompileDirectory(localServerConfig.SRC_PATH, localServerConfig.APP_PATH);
    }

    /**
     * 初始化日志打印
     * @private
     */
    _initLog() {
        logger.init(this.localServerConfig.logPath);
        mockstarLogger.info(this.localServerConfig);
    }

    /**
     * 获得 mockstar 的路由
     * @private
     */
    _createRouter() {
        this.router = mockstarServer.router(this.localServerConfig);
    }

    /**
     * 获得 mockstar 的中间件
     * @private
     */
    _createMiddleware() {
        this.middleware = mockstarServer.middleware();
    }

    /**
     * 获得 mockstar 的 express 应用
     * @private
     */
    _createApp() {
        const self = this;
        const app = mockstarServer.create();

        const adminSiteRootPath = this.localServerConfig.getAdminSiteRootPath();
        const adminSiteBase = this.localServerConfig.getAdminSiteBase();
        const rootPath = this.localServerConfig.rootPath;

        // Set default middlewares (logger, static, cors and no-cache)
        app.use(this.middleware);

        // 如果访问的是根目录，则跳转到首页
        // GET adminSiteRootPath，跳转到 adminPageHome
        // GET /，跳转到 /mockstar-admin/dashboard
        // TODO 这里的规则似乎没有生效
        app.get(adminSiteRootPath, function (req, res) {
            res.redirect(`${adminSiteRootPath}/server`);
        });

        app.get('/getnamespace', function (req, res) {
            res.end(JSON.stringify({
                namespaces: self.localServerConfig.namespaceList
            }))
        });

        app.get('/createnamespace', function (req, res) {
            //获取query
            const query = url.parse(req.url, true).query;
            if (!query.name) {
                res.end(JSON.stringify({
                    ret: 101,
                    msg: 'no name'
                }));
            }
            if (!fs.existsSync(path.join(rootPath, './namespace/' + query.name))) {
                fs.mkdir(path.join(rootPath, './namespace/' + query.name), {
                    recursive: true
                }, (err) => {
                    if (err) {
                        res.end(JSON.stringify({
                            ret: 103,
                            msg: JSON.stringify(err)
                        }));
                    }
                    fs.writeFile(path.join(rootPath, `./namespace/${query.name}/pm.json`), JSON.stringify({ispm: true}))
                    child_process.spawn('cp', ['-r', path.join(rootPath, './namespace/common/'), path.join(rootPath, './namespace/' + query.name)]); 
                    fs.readdir(path.join(rootPath, './namespace'), (err, files) => {
                        if (err) {
                            console.error(err);
                            res.end([]);
                        }
        
                        let namespacearr = [];
        
                        files.forEach(function (filename) {
                            namespacearr.push(filename);
                        });
        
                        res.end(JSON.stringify({
                            ret: 0,
                            namespaces: namespacearr,
                            msg: 'ok'
                        }))
                    })
                });
            } else {
                res.end(JSON.stringify({
                    ret: 102,
                    msg: 'have exist'
                }));
            }
        });

        // app.get('/mytest', function (req, res) {
        //     res.send('hello,world!');
        // });

        // 静态资源的配置
        // GET ${adminSiteBase}/mockers/:name/static/* 静态资源
        // http://localhost:9527/mockstar-admin/mockers/demo_03/static/sub/workflow.png
        app.get(`${adminSiteBase}/mockers/:mockerName/static/*`, (req, res) => {
            // req.params[0] = 'sub/workflow.png'
            // req.params.name = 'demo_03'

            let mockerName = req.params.mockerName;
            let mockerItem = this.router._mockerParser.getMockerByName(mockerName);
            let staticRelativePath = path.join('static', req.params[0]);

            if (!mockerItem) {
                res.send(`Can not find ${path.join(mockerName, staticRelativePath)}`);
            } else {
                res.sendFile(path.join(mockerItem.basePath, staticRelativePath));
            }
        });

        // 单页应用，因此只要是 ${adminSiteBase}/* 的都加载静态html页面
        // GET ${adminSiteBase}/*
        app.get(`${adminSiteBase}/*`, function (req, res) {
            // res.sendFile(path.join(__dirname, '../webui/build', 'index.html'));
            // 这里没有使用 res.sendFile，原因是需要将一些参数项放在 index.html 上

            self._getHtml()
                .then((data) => {
                    res.send(data);
                })
                .catch((err) => {
                    res.status(500).send(err);
                });
        });

        // 日志打印模块
        app.use(logger.connectLogger());

        // To handle POST, PUT and PATCH you need to use a body-parser
        // You can use the one used by JSON Server
        app.use(mockstarServer.bodyParser);
        app.use((req, res, next) => {
            if (req.method === 'POST') {
                req.body.createdAt = Date.now();
            }

            // 每次请求都将本地的配置信息透传到前端页面
            // res.locals.localServerConfig = this.localServerConfig.getShowDataInWeb();

            // Continue to JSON Server router
            next();
        });

        // Use handler router
        app.use(this.router);

        this.app = app;
    }

    _getHtml() {
        return new Promise((resolve, reject) => {
            if (this.html) {
                return resolve(this.html);
            }

            fs.readFile(path.join(__dirname, '../webui/build', 'index.html'), 'utf8', (err, content) => {
                if (err) {
                    reject(err);
                } else {
                    // 需要插入到 html head 的脚本
                    const injectInHead = '<script>window._mockstar_config_=' + JSON.stringify(this.localServerConfig.getShowDataInWeb()) + '</script>';

                    // 替换内容
                    this.html = content.replace('</head>', injectInHead + '</head>');

                    // 如果需要自定义静态资源的根路径，则还需要进行替换
                    const { staticBasePath } = this.localServerConfig;
                    if (staticBasePath && staticBasePath !== '/') {
                        this.html = this.html.replace('/static/css/', staticBasePath + 'static/css/');
                        this.html = this.html.replace('/static/js/', staticBasePath + 'static/js/');
                    }

                    resolve(this.html);
                }
            });
        });
    }

    /**
     * 获得 mockstar 的 server
     * @private
     */
    _createServer() {
        // https://socket.io/get-started/chat/#The-web-framework
        // 2018.10.23 突然无法启动websocket，原因未知
        // let server = require('http').createServer(app);
        // https://socket.io/docs/#Using-with-Express
        let server = require('http').Server(this.app);

        // TODO 触发 onBeforeServerListen 事件
        // 如果启动了 plugin=async 则开启 websocket
        if (this.router._mockerParser.isSupportAsync()) {
            require('./plugins/mocker/websocket')(this.localServerConfig, server, this.router._mockerParser);
        }

        this.server = server;
    }

    /**
     * 启动 mockstar 的 server
     * @param {Function} callback 回调函数
     * @private
     */
    _startServer(callback) {
        this.server.listen(this.localServerConfig.port, () => {
            // mockstarLogger.info('mockstar server is running');
            console.log('mockstar server is running!');
            console.log('Use your device to visit the following URL list, gets the IP of the URL you can visit:');
            console.log('\n');
            console.log(`http://127.0.0.1:${this.localServerConfig.port}/`);
            console.log('\n');

            // 启动成功之后进行回调
            if (typeof callback === 'function') {
                callback(true, Object.assign({}, this.localServerConfig));
            }
        });
    }

    /**
     * 停止 mockstar 的 server
     * @param {Function} callback 回调函数
     * @private
     */
    _stopServer(callback) {
        this.server.close(callback);
    }
}

/**
 * 启动服务
 *
 * @param {LocalServerConfig} localServerConfig 配置项参数
 * @param {Function} callback 回调函数
 */
module.exports = (localServerConfig, callback) => {
    let runServer = new RunServer(localServerConfig);

    runServer.start(callback);

    // 需要监听文件的变化自动重启
    if (localServerConfig.watch) {
        console.log('watching...');

        // 文件变化之后延时重启的时间，单位 ms
        const delayRestart = 100;

        // 当前是否正在重启中
        let isRestarting = false;

        // 请求重启的队列
        let queue = [];

        let delayT;

        function restart() {
            if (delayT) {
                clearTimeout(delayT);
            }

            delayT = setTimeout(() => {
                // 如果当时正在重启中，则先放入到缓存队列中
                if (isRestarting) {
                    queue.push(Date.now());
                    return;
                }

                isRestarting = true;

                // 重新启动
                runServer.restart(() => {
                    // 如果重启的过程中还有变化，则继续重新启动
                    if (queue.length) {
                        queue = [];
                        restart();
                    } else {
                        isRestarting = false;
                    }
                });
            }, delayRestart);
        }

        fs.watch(localServerConfig.mockServerPath, { recursive: true }, (event, filename) => {
            console.log('watch testFolder event', event);
            console.log('watch testFolder filename', filename);

            restart();

        });
    }

    return runServer;
};
