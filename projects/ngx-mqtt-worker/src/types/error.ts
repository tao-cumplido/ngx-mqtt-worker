export interface RequestError {
    message: string;
    name?: string;
    stack?: string;
}

export interface RequestErrorEvent {
    type: 'error';
    error: RequestError;
}

export const enum ErrorType {
    NoSuchConnectionError = 'NoSuchConnectionError',
    InvalidTopicError = 'InvalidTopicError',
    NoSuchSubscriptionError = 'NoSuchSubscriptionError',
    MqttConnectionError = 'MqttConnectionError',
}
