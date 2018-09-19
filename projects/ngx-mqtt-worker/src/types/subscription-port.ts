import { RequestErrorEvent } from './error';
import { SharedWorker } from './shared-worker';
import {
    MqttPort,
    Ping,
    SubscribeRequest,
    UnsubscribeRequest,
    WorkerMessage,
} from './worker';

export interface MqttMessageEvent {
    type: 'mqtt-message';
    topic: string;
    payload: Uint8Array;
}

export interface WorkerSubscriptionPort extends MqttPort {
    postMessage(message: RequestErrorEvent | MqttMessageEvent): void;
}

export type WorkerSubscriptionMessage =
    | WorkerMessage
    | Ping
    | SubscribeRequest
    | UnsubscribeRequest;

export interface ClientSubscriptionEvent extends MessageEvent {
    data: RequestErrorEvent | Ping | MqttMessageEvent;
}

export interface ClientSubscriptionPort extends MessagePort {
    postMessage(message: WorkerSubscriptionMessage): void;
}

// @ts-ignore
export interface ClientSubscriptionWorker extends SharedWorker {
    port: ClientSubscriptionPort;
}
