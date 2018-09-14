import { TestBed } from '@angular/core/testing';

import { MqttWorkerService } from './mqtt-worker.service';

describe('NgxWorkerMqttService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: MqttWorkerService = TestBed.get(MqttWorkerService);
        expect(service).toBeTruthy();
    });
});
