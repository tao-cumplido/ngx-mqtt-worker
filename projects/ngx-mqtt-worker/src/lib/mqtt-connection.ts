import { Observable, Subject } from 'rxjs';
import { share, shareReplay } from 'rxjs/operators';

import {
    ClientConnectionEvent,
    ClientConnectionWorker,
    ClientSubscriptionEvent,
    ClientSubscriptionWorker,
    RequestError,
    SharedWokerConstructor,
    WorkerMessageEvent,
} from '@types';

type QoS = import('mqtt').QoS;
type IClientOptions = import('mqtt').IClientOptions;
type IClientPublishOptions = import('mqtt').IClientPublishOptions;

declare var SharedWorker: SharedWokerConstructor;

export interface ObserveOptions {
    qos?: QoS;
    retain?: boolean;
}

export class MqttConnection {
    private connectionWorker: ClientConnectionWorker;

    private on = {
        error$: new Subject<RequestError>(),
        connect$: new Subject<void>(),
        offline$: new Subject<void>(),
        close$: new Subject<void>(),
    };

    get onError$(): Observable<RequestError> {
        return this.on.error$;
    }

    get onConnect$(): Observable<void> {
        return this.on.connect$;
    }

    get onClose$(): Observable<void> {
        return this.on.close$;
    }

    get onOffline$(): Observable<void> {
        return this.on.offline$;
    }

    constructor(
        private worker: string,
        private name: string,
        url: string,
        options?: IClientOptions
    ) {
        this.connectionWorker = new SharedWorker(worker);
        this.connectionWorker.port.addEventListener(
            'message',
            this.handlePingMessages
        );
        this.connectionWorker.port.addEventListener(
            'message',
            this.handleConnectionMessages
        );
        this.connectionWorker.port.start();
        this.connectionWorker.port.postMessage({
            type: 'connect',
            name,
            url,
            options,
        });
    }

    observe(topic: string, options?: ObserveOptions): Observable<Uint8Array> {
        const retain = options && options.retain;
        const clientOptions =
            options && typeof options.qos === 'number'
                ? { qos: options.qos }
                : undefined;

        const source$ = new Subject<Uint8Array>();

        return new Observable<Uint8Array>((observer) => {
            const subscription = source$.subscribe(observer);
            const subscriptionWorker: ClientSubscriptionWorker = new SharedWorker(
                this.worker
            );

            const handleMessages = ({ data }: ClientSubscriptionEvent) => {
                switch (data.type) {
                    case 'ping':
                        return subscriptionWorker.port.postMessage(data);
                    case 'error':
                        return source$.error(data.error);
                    case 'mqtt-message':
                        return source$.next(data.payload);
                }
            };

            subscriptionWorker.port.addEventListener('message', handleMessages);
            subscriptionWorker.port.start();

            subscriptionWorker.port.postMessage({
                type: 'subscribe',
                connection: this.name,
                topic,
                options: clientOptions,
            });

            return () => {
                subscription.unsubscribe();
                subscriptionWorker.port.postMessage({
                    type: 'unsubscribe',
                    connection: this.name,
                    topic,
                });
                subscriptionWorker.port.removeEventListener(
                    'message',
                    handleMessages
                );
                subscriptionWorker.port.close();
            };
        }).pipe(retain ? shareReplay(1) : share());
    }

    publish(
        topic: string,
        message: string | Uint8Array,
        options?: IClientPublishOptions
    ): void {
        this.connectionWorker.port.postMessage({
            type: 'publish',
            connection: this.name,
            topic,
            payload: message,
            options,
        });
    }

    private handlePingMessages = ({ data }: WorkerMessageEvent) => {
        if (data.type === 'ping') {
            this.connectionWorker.port.postMessage(data);
        }
    };

    private handleConnectionMessages = ({ data }: ClientConnectionEvent) => {
        switch (data.type) {
            case 'error':
                this.on.error$.next(data.error);
                return;
            case 'mqtt-connect':
                return this.on.connect$.next();
            case 'mqtt-close':
                return this.on.close$.next();
            case 'mqtt-offline':
                return this.on.offline$.next();
        }
    };
}
