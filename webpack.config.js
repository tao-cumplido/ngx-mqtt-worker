const { pathExists, readJson, writeFile } = require('fs-extra');
const path = require('path');

const { TsConfigPathsPlugin } = require('awesome-typescript-loader');
const fetch = require('node-fetch').default;

async function createConfig() {
    const cwd = process.cwd();
    const browserMqtt = path.join(cwd, 'browser-mqtt', 'index.js');

    if (!(await pathExists(browserMqtt))) {
        const packageJson = await readJson(path.join(cwd, 'package.json'));
        const version = packageJson.devDependencies.mqtt;
        const response = await fetch(
            `https://unpkg.com/mqtt@${version}/dist/mqtt.js`
        );
        await writeFile(browserMqtt, await response.text());
    }

    return {
        target: 'webworker',
        entry: './projects/ngx-mqtt-worker/src/worker/index.ts',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use:
                        'awesome-typescript-loader?configFileName=./projects/ngx-mqtt-worker/tsconfig.worker.json',
                    exclude: [/node_modules/],
                },
            ],
        },
        resolve: {
            extensions: ['.js', '.ts'],
            plugins: [new TsConfigPathsPlugin()],
        },
        output: {
            filename: 'mqtt-worker.js',
            path: path.join(cwd, 'dist', 'ngx-mqtt-worker', 'bundles'),
        },
    };
}

exports.default = createConfig();
