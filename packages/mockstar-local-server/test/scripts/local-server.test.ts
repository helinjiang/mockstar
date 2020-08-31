import path from 'path';
// @ts-ignore
import request from 'superagent';
import fse from 'fs-extra';
import {expect} from 'chai';

// @ts-ignore
import testServer from '../data/test-sever';

describe('local server for mockstar', () => {
  let port;
  let cgiBase: string;

  before(function () {
    fse.removeSync(path.join(__dirname, '../data/local-server-test/build'));

    return testServer
      .start(require(path.join(__dirname, '../data/local-server-test/mockstar.config.js')))
      .then((data: {port: number}) => {
        // console.log('----', data);
        port = data.port;
        cgiBase = `http://localhost:${port}`;

        return data;
      });
  });

  after(function () {
    fse.removeSync(path.join(__dirname, '../data/local-server-test/build'));
    testServer.stop();
  });

  describe('get /mockstar-cgi/mocker', () => {
    let data: any[];

    before(function () {
      return request
        .get(cgiBase + '/mockstar-cgi/mocker')
        .then((response: {res: {text: string}}) => {
          data = JSON.parse(response.res.text);
          // console.log(data);
        });
    });

    it('should return array and length is 3', () => {
      expect(data).to.be.a('array').and.have.lengthOf(4);
    });

    it('should exist demo_03_post', () => {
      let filterResult = data.filter(item => item.name === 'demo_03_post');
      let target = filterResult[0];

      expect(filterResult).to.be.a('array').and.have.lengthOf(1);
      expect(target.mockModuleList).to.be.a('array').and.have.lengthOf(3);
      expect(target.config).to.eql({
        name: 'demo_03_post',
        route: '/cgi-bin/a/b/demo_03_post',
        routeExtra: {},
        description: 'description for demo_03_post',
        plugin: 'xhr',
        disable: false,
        defaultModule: 'success_1',
        activeModule: 'success_1',
        method: 'POST',
        priority: 0,
        tags: ['全部', 'tag1', 'tag2'],
      });
    });
  });

  describe('get /mockstar-cgi/mocker/:mockerName', () => {
    let data: {mockModuleList: any; config: any};

    before(function () {
      return request
        .get(cgiBase + '/mockstar-cgi/mocker/demo_03_post')
        .then((response: {res: {text: string}}) => {
          data = JSON.parse(response.res.text);
          // console.log(data);
        });
    });

    it('should return object', () => {
      expect(data)
        .to.be.a('object')
        .and.have.all.keys('basePath', 'name', 'mockModuleList', 'config', 'watch');
    });

    it('should exist target.mockModuleList', () => {
      expect(data.mockModuleList).to.be.a('array').and.have.lengthOf(3);
    });

    it('should exist target.config', () => {
      expect(data.config).to.eql({
        name: 'demo_03_post',
        route: '/cgi-bin/a/b/demo_03_post',
        routeExtra: {},
        description: 'description for demo_03_post',
        plugin: 'xhr',
        disable: false,
        defaultModule: 'success_1',
        activeModule: 'success_1',
        method: 'POST',
        priority: 0,
        tags: ['全部', 'tag1', 'tag2'],
      });
    });
  });

  describe('get /mockstar-cgi/mocker/:mockerName/readme', () => {
    it('should exist content', () => {
      return request
        .get(cgiBase + '/mockstar-cgi/mocker/demo_03_post/readme')
        .then((response: {res: {text: string}}) => {
          let data = JSON.parse(response.res.text);
          expect(data.html).to.have.lengthOf.at.least(100);
        });
    });

    it('should be empty', () => {
      return request
        .get(cgiBase + '/mockstar-cgi/mocker/demo_01/readme')
        .then((response: {res: {text: string}}) => {
          let data = JSON.parse(response.res.text);
          expect(data.html).to.be.empty;
        });
    });
  });

  describe('get /mockstar-admin/mockers/:name/static/*', () => {
    it('should support jpg ', () => {
      return request
        .get(cgiBase + '/mockstar-admin/mockers/demo_03_post/static/logo.jpg')
        .then((response: {status: any; type: any; body: string | any[]}) => {
          expect(response.status).to.equal(200);
          expect(response.type).to.equal('image/jpeg');
          expect(response.body.length).to.equal(2615);
        });
    });

    it('should support subdir and png', () => {
      return request
        .get(cgiBase + '/mockstar-admin/mockers/demo_03_post/static/sub/workflow.png')
        .then((response: {status: any; type: any; body: string | any[]}) => {
          expect(response.status).to.equal(200);
          expect(response.type).to.equal('image/png');
          expect(response.body.length).to.equal(3837);
        });
    });
  });

  describe('post /mockstar-cgi/mocker/:mockerName', () => {
    it('change config.activeModule', () => {
      return request
        .post(cgiBase + '/mockstar-cgi/mocker/demo_03_post', {
          config: {
            activeModule: 'success_2',
          },
        })
        .then((response: {res: {text: string}}) => {
          let data = JSON.parse(response.res.text);

          // 1. 修改 activeModule 为 success_2
          expect(data.config.activeModule).to.equal('success_2');

          return request
            .get(cgiBase + '/mockstar-cgi/mocker/demo_03_post')
            .then((response: {res: {text: string}}) => {
              let data = JSON.parse(response.res.text);

              // 2. 查询下 activeModule 为 success_2
              expect(data.config.activeModule).to.equal('success_2');

              return request
                .post(cgiBase + '/mockstar-cgi/mocker/demo_03_post', {
                  config: {
                    activeModule: 'success_1',
                  },
                })
                .then((response: {res: {text: string}}) => {
                  let data = JSON.parse(response.res.text);

                  // 3. 修改 activeModule 为 success_1
                  expect(data.config.activeModule).to.equal('success_1');
                });
            });
        });
    });

    it('change config.disable', () => {
      return request
        .post(cgiBase + '/mockstar-cgi/mocker/demo_01', {
          config: {
            disable: false,
          },
        })
        .then((response: {res: {text: string}}) => {
          let data = JSON.parse(response.res.text);

          // 1. 修改 disable 为 false
          expect(data.config.disable).to.be.false;

          return request
            .get(cgiBase + '/mockstar-cgi/mocker/demo_01')
            .then((response: {res: {text: string}}) => {
              let data = JSON.parse(response.res.text);

              // 2. 查询下 disable 为 false
              expect(data.config.disable).to.be.false;

              return request
                .post(cgiBase + '/mockstar-cgi/mocker/demo_01', {
                  config: {
                    disable: true,
                  },
                })
                .then((response: {res: {text: string}}) => {
                  let data = JSON.parse(response.res.text);

                  // 3. 修改 disable 为 true
                  expect(data.config.disable).to.be.true;
                });
            });
        });
    });
  });
});
