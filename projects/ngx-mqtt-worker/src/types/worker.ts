import {
    IClientOptions,
    IClientPublishOptions,
    IClientSubscribeOptions,
} from 'mqtt';

import { RequestErrorEvent } from './error';

export interface ConnectRequest {
    type: 'connect';
    name: string;
    url: string;
    options?: IClientOptions;
}

export interface SubscribeRequest {
    type: 'subscribe';
    connection: string;
    topic: string;
    options?: IClientSubscribeOptions;
}

export interface UnsubscribeRequest {
    type: 'unsubscribe';
    connection: string;
    topic: string;
}

export interface PublishRequest {
    type: 'publish';
    connection: string;
    topic: string;
    payload: string | Buffer;
    options?: IClientPublishOptions;
}

export interface CloseRequest {
    type: 'close';
    connection: string;
}

export interface Ping {
    type: 'ping';
}

export interface MqttPort extends MessagePort {
    isDead: Promise<void>;
    postMessage(message: RequestErrorEvent): void;
}

export interface MonitorPort extends MqttPort {
    postMessage(message: RequestErrorEvent | Ping): void;
}

export interface MqttWorkerEvent extends MessageEvent {
    ports: [MqttPort];
}

export interface WorkerMessage {
    type: string;
}

export interface WorkerMessageEvent extends MessageEvent {
    data: WorkerMessage;
}

export interface MqttPortEvent extends MessageEvent {
    data:
        | ConnectRequest
        | SubscribeRequest
        | UnsubscribeRequest
        | PublishRequest
        | CloseRequest
        | Ping;
}
