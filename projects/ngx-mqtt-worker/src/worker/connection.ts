import {
    IClientPublishOptions,
    IClientSubscribeOptions,
    MqttClient,
} from 'mqtt';

import {
    ErrorType,
    MqttMessageEvent,
    MqttPortEvent,
    WorkerConnectionMessage,
    WorkerConnectionPort,
    WorkerSubscriptionPort,
} from '@types';
import { errorMessage } from './error';

export class Connection {
    private subscriptions = new Map<RegExp, Set<WorkerSubscriptionPort>>();
    private listeners = new Set<WorkerConnectionPort>();

    private state?: WorkerConnectionMessage;

    constructor(private client: MqttClient) {
        this.initClient();
    }

    register(port: WorkerConnectionPort): void {
        this.listeners.add(port);

        if (this.state) {
            port.postMessage(this.state);
        }

        port.isDead.then(() => this.listeners.delete(port));
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

        port.isDead.then(() => references.delete(port));
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

    close(
        port: WorkerConnectionPort,
        eventHandler: (event: MqttPortEvent) => void
    ): boolean {
        this.listeners.delete(port);

        if (this.listeners.size) return false;

        this.subscriptions.forEach((references) => {
            references.forEach((subscriptionPort) => {
                subscriptionPort.removeEventListener('message', eventHandler);
            });
        });

        this.client.end(true);
        return true;
    }

    private initClient(): void {
        this.client.on('connect', () => {
            const state: WorkerConnectionMessage = { type: 'mqtt-connect' };
            this.state = state;
            this.listeners.forEach((port) => {
                port.postMessage(state);
            });
        });

        this.client.on('reconnect', () => {});

        this.client.on('close', () => {
            const state: WorkerConnectionMessage = { type: 'mqtt-close' };
            this.state = state;
            this.listeners.forEach((port) => {
                port.postMessage(state);
            });
        });

        this.client.on('offline', () => {
            const state: WorkerConnectionMessage = { type: 'mqtt-offline' };
            this.state = state;
            this.listeners.forEach((port) => {
                port.postMessage(state);
            });
        });

        this.client.on('error', (error) => {
            const state = errorMessage(
                error.message,
                ErrorType.MqttConnectionError,
                error.stack
            );
            this.state = state;
            this.listeners.forEach((port) => {
                port.postMessage(state);
            });
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
