import { Injectable } from '@nestjs/common';
import { CircuitBreaker } from './circuit-breaker';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AppService {
  private sleepCircuitBreaker: CircuitBreaker;

  constructor() {
    this.sleepCircuitBreaker = new CircuitBreaker(sleep, {
      resetTimeout: 10000,
      errorPercentage: 5,
      defaultResponse: Result.fail(
        'Mensagem de erro padrão do Circuit Breaker',
      ),
    });
  }

  async getHello(): Promise<string> {
    const result = await this.test();
    if (result.isFailure()) {
      this.sleepCircuitBreaker.setOpened();
      return result.getError();
    }
    return result.getValue();
  }

  async test(): Promise<ResultType<string, string>> {
    const result = await this.sleepCircuitBreaker.fire<void | ResultType<
      void,
      string
    >>(1500);
    if (!result) {
      return Result.fail('Mensagem de error');
    }
    if (result.isFailure()) {
      return result;
    }
  }
}

class Success<V> {
  constructor(public _value: V) {}

  isSuccess = (): this is Success<V> => true;
  isFailure = (): this is Failure<V> => false;

  isEmpty() {
    return !this._value;
  }

  getValue() {
    return this._value;
  }
}

class Failure<E> {
  constructor(public _error: E) {}

  isSuccess = (): this is Success<E> => false;
  isFailure = (): this is Failure<E> => true;

  getError() {
    return this._error;
  }
}

export type ResultType<V, E> = Success<V> | Failure<E>;

export class Result {
  static ok<U>(value?: U): Success<U> {
    return new Success<U>(value);
  }

  static fail<U>(error: U): Failure<U> {
    return new Failure<U>(error);
  }

  static combine<V, E>(results: ResultType<V, E>[]): ResultType<V, E> {
    const foundFailure = results.find((target) => target.isFailure() === true);
    if (foundFailure) {
      return foundFailure;
    }

    return Result.ok();
  }

  static filterByError<V, E>(results: ResultType<V, E>[]): E[] {
    return results.map((target) => {
      if (target.isFailure()) {
        return target.getError();
      }
    });
  }

  static filterBySuccess<V, E>(results: ResultType<V, E>[]): V[] {
    return results.map((target) => {
      if (target.isSuccess()) {
        return target.getValue();
      }
    });
  }
}
