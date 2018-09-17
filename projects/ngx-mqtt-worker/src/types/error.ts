export interface ErrorEvent {
    type: 'error';
    error: {
        message: string;
        name?: string;
        stack?: string;
    };
}
