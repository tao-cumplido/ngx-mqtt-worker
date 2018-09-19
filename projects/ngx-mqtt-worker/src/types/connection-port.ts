import { RequestErrorEvent } from './error';
import { SharedWorker } from './shared-worker';
import {
    CloseRequest,
    ConnectRequest,
    MqttPort,
    Ping,
    PublishRequest,
    WorkerMessage,
} from './worker';

export interface MqttOfflineEvent {
    type: 'mqtt-offline';
}

export interface MqttConnectEvent {
    type: 'mqtt-connect';
}

export interface MqttCloseEvent {
    type: 'mqtt-close';
}

export type WorkerConnectionMessage =
    | RequestErrorEvent
    | MqttOfflineEvent
    | MqttConnectEvent
    | MqttCloseEvent;

export type ClientConnectionMessage =
    | WorkerMessage
    | Ping
    | ConnectRequest
    | CloseRequest
    | PublishRequest;

export interface WorkerConnectionPort extends MqttPort {
    postMessage(message: WorkerConnectionMessage): void;
}

export interface ClientConnectionEvent extends MessageEvent {
    data: WorkerConnectionMessage;
}

export interface ClientConnectionPort extends MessagePort {
    postMessage(message: ClientConnectionMessage): void;
}

export interface ClientConnectionWorker extends SharedWorker {
    port: ClientConnectionPort;
}
