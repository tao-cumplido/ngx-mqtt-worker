import * as mqtt from 'browser-mqtt';

import {
    ConnectRequest,
    MonitorPort,
    MqttPort,
    MqttPortEvent,
    MqttWorkerEvent,
    PublishRequest,
    SubscribeRequest,
    UnsubscribeRequest,
} from '@types';
import { Connection } from './connection';
import { errorMessage } from './error';
import { validate } from './filter';

const connections = new Map<string, Connection>();
const filterCache: Partial<Record<string, RegExp>> = {};

// @ts-ignore
addEventListener('connect', ({ ports: [port] }: MqttWorkerEvent) => {
    monitorPort(port);

    const handleMessage: (event: MqttPortEvent) => void = ({ data }) => {
        switch (data.type) {
            case 'connect':
                return connect(
                    port,
                    data
                );
            case 'subscribe':
                return subscribe(port, data);
            case 'unsubscribe':
                return unsubscribe(port, data);
            case 'publish':
                return publish(port, data);
            case 'close':
                ensureConnection(port, data.connection, (connection) => {
                    connection.close(handleMessage);
                    connections.delete(data.connection);
                });
                return port.removeEventListener('message', handleMessage);
        }
    };

    port.addEventListener('message', handleMessage);

    port.start();
});

function monitorPort(port: MonitorPort): void {
    port.isDead = new Promise((resolve) => {
        const sendRequest = () =>
            setTimeout(() => {
                let handleResponse: (event: MqttPortEvent) => void;

                const killPort = setTimeout(() => {
                    port.removeEventListener('message', handleResponse);
                    resolve();
                }, 1000);

                handleResponse = ({ data }: MqttPortEvent) => {
                    if (data.type !== 'ping') return;

                    clearTimeout(killPort);
                    port.removeEventListener('message', handleResponse);
                    sendRequest();
                };

                port.addEventListener('message', handleResponse);
                port.postMessage({ type: 'ping' });
            }, 5000);
    });
}

function connect(port: MqttPort, { name, url, options }: ConnectRequest): void {
    if (connections.has(name)) return;
    const client = mqtt.connect(
        url,
        options
    );
    connections.set(name, new Connection(port, client));
}

function subscribe(
    port: MqttPort,
    { connection: name, topic, options }: SubscribeRequest
): void {
    ensureConnection(port, name, (connection) => {
        const filter = filterCache[topic] || validate(topic);

        if (!filter) {
            const message = errorMessage(`Invalid topic filter '${topic}'`);
            port.postMessage(message);
            return;
        }

        filterCache[topic] = filter;
        connection.subscribe(topic, filter, port, options);
    });
}

function unsubscribe(
    port: MqttPort,
    { connection: name, topic }: UnsubscribeRequest
): void {
    ensureConnection(port, name, (connection) => {
        const filter = filterCache[topic];

        if (!filter) {
            const message = errorMessage(
                `Topic '${topic}' hasn't been subscribed yet.`
            );
            port.postMessage(message);
            return;
        }

        connection.unsubscribe(topic, filter, port);
    });
}

function publish(
    port: MqttPort,
    { connection: name, topic, payload, options }: PublishRequest
): void {
    ensureConnection(port, name, (connection) =>
        connection.publish(topic, payload, options)
    );
}

function ensureConnection(
    port: MqttPort,
    name: string,
    callback: (connection: Connection) => void
): void {
    const connection = connections.get(name);

    if (connection) {
        callback(connection);
    } else {
        const message = errorMessage(`Connection '${name}' doesn't exist.`);
        port.postMessage(message);
    }
}
