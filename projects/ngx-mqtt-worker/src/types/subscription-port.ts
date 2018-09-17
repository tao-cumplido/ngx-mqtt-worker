import { ErrorEvent } from './error';
import { MqttPort } from './worker';

export interface MqttMessageEvent {
    type: 'mqtt-message';
    topic: string;
    payload: Uint8Array;
}

export interface WorkerSubscriptionPort extends MqttPort {
    postMessage(message: ErrorEvent | MqttMessageEvent): void;
}
