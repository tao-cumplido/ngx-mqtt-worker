import { pathExists, readJson, writeFile } from 'fs-extra';
import * as path from 'path';

import { TsConfigPathsPlugin } from 'awesome-typescript-loader';
import fetch from 'node-fetch';
import { Configuration } from 'webpack';

interface PackageJson {
    devDependencies: Record<string, string>;
}

async function createConfig(): Promise<Configuration> {
    const cwd = process.cwd();
    const browserMqtt = path.join(cwd, 'browser-mqtt', 'index.js');

    if (!(await pathExists(browserMqtt))) {
        const packageJson: PackageJson = await readJson(
            path.join(cwd, 'package.json')
        );
        const mqttVersion = packageJson.devDependencies.mqtt.replace('~', '');
        const response = await fetch(
            `https://unpkg.com/mqtt@${mqttVersion}/dist/mqtt.js`
        );
        await writeFile(browserMqtt, await response.text());
    }

    return {
        entry: [
            './browser-mqtt/index.js',
            './projects/ngx-mqtt-worker/src/worker/index.ts',
        ],
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'awesome-typescript-loader',
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

export default createConfig();
