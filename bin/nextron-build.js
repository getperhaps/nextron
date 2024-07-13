#!/usr/bin/env node
'use strict';

var arg = require('arg');
var chalk = require('chalk');
var execa = require('execa');
var fs$1 = require('fs-extra');
var path = require('path');
var fs = require('fs');

const getNextronConfig = () => {
  const nextronConfigPath = path.join(process.cwd(), 'nextron.config.js');
  if (fs.existsSync(nextronConfigPath)) {
    return require(nextronConfigPath);
  } else {
    return {};
  }
};

const info = text => {
  console.log(chalk`{cyan [nextron]} ${text}`);
};

const args = arg({
  '--mac': Boolean,
  '--linux': Boolean,
  '--win': Boolean,
  '--x64': Boolean,
  '--ia32': Boolean,
  '--armv7l': Boolean,
  '--arm64': Boolean,
  '--universal': Boolean,
  '--config': String,
  '--publish': String,
  '--no-pack': Boolean
});
const cwd = process.cwd();
const appDir = path.join(cwd, 'app');
const distDir = path.join(cwd, 'dist');
const rendererSrcDir = getNextronConfig().rendererSrcDir || 'renderer';
const execaOptions = {
  cwd,
  stdio: 'inherit'
};
(async () => {
  // Ignore missing dependencies
  process.env.ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES = 'true';
  try {
    info('Clearing previous builds');
    await Promise.all([fs$1.remove(appDir), fs$1.remove(distDir)]);
    info('Delete app directory if exists and create again');
    await fs$1.remove(appDir);
    await fs$1.mkdir(appDir);
    info('Building renderer process');
    await execa('sh', ['-c', `cd ${rendererSrcDir} && yarn next build && mv out/* ${appDir} && rm -rf out`], execaOptions);
    info('Building main process');
    await execa('node', [path.join(__dirname, 'webpack.config.js')], execaOptions);
    if (args['--no-pack']) {
      info('Skip packaging...');
    } else {
      info('Packaging - please wait a moment');
      await execa('electron-builder', createBuilderArgs(), execaOptions);
    }
    info('See `dist` directory');
  } catch (err) {
    console.log(chalk`

{bold.red Cannot build electron packages:}
{bold.yellow ${err}}
`);
    process.exit(1);
  }
})();
function createBuilderArgs() {
  const results = [];
  if (args['--config']) {
    results.push('--config');
    results.push(args['--config'] || 'electron-builder.yml');
  }
  if (args['--publish']) {
    results.push('--publish');
    results.push(args['--publish']);
  }
  args['--mac'] && results.push('--mac');
  args['--linux'] && results.push('--linux');
  args['--win'] && results.push('--win');
  args['--x64'] && results.push('--x64');
  args['--ia32'] && results.push('--ia32');
  args['--armv7l'] && results.push('--armv7l');
  args['--arm64'] && results.push('--arm64');
  args['--universal'] && results.push('--universal');
  return results;
}
