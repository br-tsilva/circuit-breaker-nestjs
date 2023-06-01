import { Logger } from '@nestjs/common';
import * as circuitBreaker from 'opossum';

export class CircuitBreaker {
  private breaker: circuitBreaker;
  private options: CircuitBreaker.Options;

  constructor(
    action: (...args: any[]) => Promise<any>,
    options: CircuitBreaker.Options,
  ) {
    this.breaker = new circuitBreaker(action, {
      timeout: options.timeout ?? false,
      resetTimeout: options.resetTimeout,
      errorThresholdPercentage: options.errorPercentage,
    });
    this.options = options;
  }

  fire<T>(...args: any[]): Promise<T> {
    return this.breaker
      .fire(...args)
      .then((res: T) => res)
      .catch(() => {
        Logger.error('Circuit breaker has failed', CircuitBreaker.name);
        if (this.options.throwResponse) {
          throw this.options.defaultResponse;
        }
        return this.options.defaultResponse;
      });
  }

  setClosed() {
    this.breaker.close();
  }

  setOpened() {
    this.breaker.open();
  }
}

export namespace CircuitBreaker {
  export type Options = {
    timeout?: number;
    errorPercentage: number;
    resetTimeout: number;
    defaultResponse: any;
    throwResponse?: boolean;
  };
}
