import xs, {Stream} from 'xstream';

function makeThrottleListener<T> (schedule, currentTime, period, listener, state) {
  return {
    next (value: T) {
      const lastEventTime = state.lastEventTime;
      const time = currentTime();

      const timeSinceLastEvent = time - lastEventTime;
      const throttleEvent = timeSinceLastEvent <= period;

      if (throttleEvent) {
        return;
      }

      schedule.next(listener, time, value);

      state.lastEventTime = time;
    },

    error (error) {
      schedule.error(listener, currentTime(), error);
    },

    complete () {
      schedule.completion(listener, currentTime());
    }
  }
}

function makeThrottle (schedule, currentTime) {
  return function throttle (period: number) {
    return function throttleOperator<T> (stream: Stream<T>): Stream<T> {
      const state = {lastEventTime: -Infinity}; // so that the first event is always scheduled

      return xs.create<T>({
        start (listener) {
          const throttleListener = makeThrottleListener<T>(
            schedule,
            currentTime,
            period,
            listener,
            state
          );

          stream.addListener(throttleListener)
        },

        stop () {}
      });
    }
  }
}

export {
  makeThrottle
}
