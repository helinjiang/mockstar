# MockStar

[MockStar](https://github.com/mockstarjs/mockstar) 是一个专注数据模拟的工具，可以更容易编写、管理和使用模拟数据。

> 更多使用文档请访问 https://mockstarjs.github.io/mockstar/ 。

## 特性

- 支持传统的 `xhr` 和 `fetch` 类型请求
- 支持对 `websocket` 或者 `jsbridge` 回调等异步数据

## 安装

```bash
$ npm install mockstar-cli -g
```

## 使用

### 命令行

```bash
# 初始化一个项目
$ mockstar init project

# 初始化一个 mocker
$ mockstar init mocker

# 启动 mockstar 服务（后台运行）
$ mockstar start --watch

# 启动 mockstar 服务（前台运行）
$ mockstar run

# 停止 mockstar 服务
$ mockstar stop
```

### 管理后台

启动 MockServer 服务之后，会自动生成一个管理后台页面，默认地址为 http://127.0.0.1:9527 。在管理后台，可以非常方便地切换所需要的不同桩数据。
