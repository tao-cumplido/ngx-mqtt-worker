export interface SharedWorker extends EventTarget, AbstractWorker {
    port: MessagePort;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
    ): void;
}

export interface SharedWokerConstructor {
    prototype: SharedWorker;
    new (stringUrl: string, name?: string): SharedWorker;
}
