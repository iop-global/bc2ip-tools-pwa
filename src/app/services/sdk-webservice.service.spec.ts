import { TestBed } from '@angular/core/testing';

import { SDKWebService } from './sdk-webservice.service';

describe('SdkWebserviceService', () => {
  let service: SDKWebService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SDKWebService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
