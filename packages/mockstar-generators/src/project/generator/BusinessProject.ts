import { InitProjectOpts, PkgVersion } from '../index';

export default class BusinessProject {
  parentPath: string;
  isDev: boolean;
  force: boolean;
  autoInstall: boolean;
  pkgVersion: PkgVersion;
  name: string;
  port: number;
  cmder: string;
  readmeDesc: string;

  constructor(opts: InitProjectOpts) {
    this.parentPath = opts.parentPath;
    this.isDev = opts.isDev || false;
    this.force = opts.force || false;
    this.autoInstall = opts.autoInstall || false;
    this.pkgVersion = opts.pkgVersion || {};
    this.name = opts.name || 'mockstar-app';
    this.port = opts.port || 9527;
    this.cmder = opts.cmder || 'npm';
    this.readmeDesc = opts.readmeDesc || '';
  }
}
