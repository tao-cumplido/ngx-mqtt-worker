import { RequestErrorEvent } from '@types';

export function errorMessage(
    message: string,
    name?: string,
    stack?: string
): RequestErrorEvent;
export function errorMessage(error: Error): RequestErrorEvent;
export function errorMessage(
    msgOrError: string | Error,
    name?: string,
    stack?: string
): RequestErrorEvent {
    if (msgOrError instanceof Error) {
        return {
            type: 'error',
            error: {
                message: msgOrError.message,
                name: msgOrError.name,
                stack: msgOrError.stack,
            },
        };
    }

    return {
        type: 'error',
        error: {
            message: msgOrError,
            name,
            stack,
        },
    };
}
