import { ErrorEvent } from '@types';

export function errorMessage(
    message: string,
    name?: string,
    stack?: string
): ErrorEvent;
export function errorMessage(error: Error): ErrorEvent;
export function errorMessage(
    msgOrError: string | Error,
    name?: string,
    stack?: string
): ErrorEvent {
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
