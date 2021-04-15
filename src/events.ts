export default class Events {
  eventHub;

  constructor() {
    this.eventHub = {};
  }

  listener(type: string, target: HTMLDivElement, handle: () => void, name: string) {
    this.eventHub[name] = {
      type,
      handle,
      target,
    };
    target.addEventListener(type, handle, false);
  }

  unListener() {
    Object.keys(this.eventHub).forEach((name) => {
      const { type, handle, target } = this.eventHub[name];
      target.removeEventListener(type, handle, false);
    });
  }
}
