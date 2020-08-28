import React, {Component} from 'react';

import ProxyInfo from './components/proxy-info';

import './index.less';

export default class Home extends Component {
  render() {
    return (
      <div className="page-home text-content">
        <h2>HOME</h2>
        <p>
          欢迎使用{' '}
          <a href="https://github.com/mockstarjs/mockstar" target="_blank" rel="noopener noreferrer">
            mockstar
          </a>
          ，欢迎给我们提{' '}
          <a href="https://github.com/mockstarjs/mockstar/issues" target="_blank" rel="noopener noreferrer">
            Issues
          </a>
          ！
        </p>

        <ProxyInfo />
      </div>
    );
  }
}
