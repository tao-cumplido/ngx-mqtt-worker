import { ErrorEvent } from './error';
import { MqttPort } from './worker';

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
    | ErrorEvent
    | MqttOfflineEvent
    | MqttConnectEvent
    | MqttCloseEvent;

export interface WorkerConnectionPort extends MqttPort {
    postMessage(message: WorkerConnectionMessage): void;
}
