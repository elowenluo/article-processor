export class Logger {
  private static formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  public static init(): void {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // rewrite console.log
    console.log = function (...args: any[]) {
      const timestamp = Logger.formatTimestamp();
      originalLog(`${timestamp} - LOG -`, ...args);
    };

    // rewrite console.error
    console.error = function (...args: any[]) {
      const timestamp = Logger.formatTimestamp();
      originalError(`${timestamp} - ERROR -`, ...args);
    };

    // rewrite console.warn
    console.warn = function (...args: any[]) {
      const timestamp = Logger.formatTimestamp();
      originalWarn(`${timestamp} - WARN -`, ...args);
    };

    // rewrite console.info
    console.info = function (...args: any[]) {
      const timestamp = Logger.formatTimestamp();
      originalInfo(`${timestamp} - INFO -`, ...args);
    };
  }
}
