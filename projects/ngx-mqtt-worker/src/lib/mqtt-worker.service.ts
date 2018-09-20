import { Injectable } from '@angular/core';
import { IClientOptions } from 'mqtt';

import { MqttConnection } from './mqtt-connection';
@Injectable({
    providedIn: 'root',
})
export class MqttWorkerService {
    connect(
        name: string,
        url: string,
        options?: IClientOptions
    ): MqttConnection {
        // TODO: make worker path configurable
        return new MqttConnection('mqtt-worker.js', name, url, options);
    }
}
