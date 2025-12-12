import { EventEmitter } from "events";
export function createEventBus() {
  const emitter = new EventEmitter();
  return {
    publish(event, payload) { emitter.emit(event, payload); },
    subscribe(event, handler) { emitter.on(event, handler); }
  };
}
