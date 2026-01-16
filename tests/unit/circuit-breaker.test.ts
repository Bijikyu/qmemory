/**
 * Circuit breaker wrapper event typing tests
 * Validates the typed EventEmitter bridge exposed by CircuitBreakerWrapper.
 */

import { STATES, createCircuitBreaker } from '../../lib/circuit-breaker.js';

describe('CircuitBreakerWrapper typed events', () => {
  const waitForEventLoop = () => new Promise(resolve => setImmediate(resolve)); // allow async emitter to flush

  test('should emit open event with typed listener', async () => {
    const breaker = createCircuitBreaker({
      failureThreshold: 1,
      volumeThreshold: 1,
      errorThresholdPercentage: 1,
      timeout: 5,
      resetTimeout: 50,
    });

    const openListener = jest.fn();
    breaker.on('open', openListener);

    await expect(
      breaker.execute(async () => {
        throw new Error('intentional failure');
      })
    ).rejects.toThrow('intentional failure');

    await waitForEventLoop();

    expect(openListener).toHaveBeenCalledTimes(1);
    expect(breaker.state).toBe(STATES.OPEN);
  });

  test('off should remove listeners before failure events fire', async () => {
    const breaker = createCircuitBreaker({
      failureThreshold: 1,
      volumeThreshold: 1,
      errorThresholdPercentage: 1,
      timeout: 5,
      resetTimeout: 50,
    });

    const failureListener = jest.fn();
    const typedListener = (error: Error) => failureListener(error); // preserve typed signature

    breaker.on('failure', typedListener);
    breaker.off('failure', typedListener);

    await expect(
      breaker.execute(async () => {
        throw new Error('intentional failure');
      })
    ).rejects.toThrow('intentional failure');

    await waitForEventLoop();

    expect(failureListener).not.toHaveBeenCalled();
  });
});
