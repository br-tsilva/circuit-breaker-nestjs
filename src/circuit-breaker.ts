import { Logger } from '@nestjs/common';
import * as circuitBreaker from 'opossum';

export class CircuitBreaker {
  private breaker: circuitBreaker;
  private defaultResponse: any = {};

  constructor(
    action: (...args: any[]) => Promise<any>,
    options: CircuitBreaker.Options,
  ) {
    this.breaker = new circuitBreaker(action, {
      timeout: options.timeout,
      resetTimeout: options.resetTimeout,
      errorThresholdPercentage: options.errorPercentage,
    });
    this.defaultResponse = options.defaultResponse;
  }

  fire<T>(...args: any[]): Promise<T> {
    return this.breaker
      .fire(...args)
      .then((res: T) => res)
      .catch(() => {
        Logger.error('Circuit breaker has failed', CircuitBreaker.name);
        return this.defaultResponse;
      });
  }

  setClosed() {
    this.breaker.close();
    Logger.warn('Circuit breaker has been closed');
  }

  setOpened() {
    this.breaker.open();
    Logger.warn('Circuit breaker has been opened');
  }
}

export namespace CircuitBreaker {
  export type Options = {
    timeout: number;
    errorPercentage: number;
    resetTimeout: number;
    defaultResponse: any;
  };
}
