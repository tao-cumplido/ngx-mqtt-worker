import {
    IClientPublishOptions,
    IClientSubscribeOptions,
    MqttClient,
} from 'browser-mqtt';

import {
    MqttMessageEvent,
    MqttPortEvent,
    WorkerConnectionPort,
    WorkerSubscriptionPort,
} from '@types';
import { errorMessage } from './error';

export class Connection {
    private subscriptions = new Map<RegExp, Set<WorkerSubscriptionPort>>();

    constructor(
        private port: WorkerConnectionPort,
        private client: MqttClient
    ) {
        this.initClient();
    }

    subscribe(
        topic: string,
        filter: RegExp,
        port: WorkerSubscriptionPort,
        options?: IClientSubscribeOptions
    ): void {
        const references = this.subscriptions.get(filter) || new Set();

        if (!references.size) {
            this.client.subscribe(topic, options!);
        }

        references.add(port);
        this.subscriptions.set(filter, references);
    }

    unsubscribe(
        topic: string,
        filter: RegExp,
        port: WorkerSubscriptionPort
    ): void {
        const references = this.subscriptions.get(filter);
        if (!references) return;

        references.delete(port);

        if (!references.size) {
            this.client.unsubscribe(topic);
            this.subscriptions.delete(filter);
        }
    }

    publish(
        topic: string,
        payload: string | Buffer,
        options?: IClientPublishOptions
    ): void {
        this.client.publish(topic, payload, options!);
    }

    close(eventHandler: (event: MqttPortEvent) => void): void {
        for (const ports of this.subscriptions.values()) {
            ports.forEach((port) => {
                port.removeEventListener('message', eventHandler);
            });
        }

        this.client.end(true);
    }

    private initClient(): void {
        this.client.on('connect', () => {
            this.port.postMessage({ type: 'mqtt-connect' });
        });

        this.client.on('reconnect', () => {});

        this.client.on('close', () => {
            this.port.postMessage({ type: 'mqtt-close' });
        });

        this.client.on('offline', () => {
            this.port.postMessage({ type: 'mqtt-offline' });
        });

        this.client.on('error', (error) => {
            this.port.postMessage(errorMessage(error));
        });

        this.client.on('message', (topic, payload) => {
            const message: MqttMessageEvent = {
                type: 'mqtt-message',
                topic,
                payload,
            };

            this.subscriptions.forEach((references, filter) => {
                if (filter.test(topic)) {
                    references.forEach((port) => port.postMessage(message));
                }
            });
        });
    }
}
