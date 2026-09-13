/**
 * utils/logger.js
 * -----------------------------------------------------------------------
 * Thin wrapper around the console so every log line in the app carries a
 * consistent, greppable prefix and a timestamp. Centralizing this also
 * means log verbosity or a remote-logging sink can be changed in one
 * place later without touching call sites.
 * -----------------------------------------------------------------------
 */

const IS_DEV = import.meta.env.DEV;

function timestamp() {
  return new Date().toISOString();
}

function format(scope, message) {
  return `[${timestamp()}] [${scope}] ${message}`;
}

export function createLogger(scope) {
  return {
    debug(message, ...rest) {
      if (IS_DEV) console.debug(format(scope, message), ...rest);
    },
    info(message, ...rest) {
      console.info(format(scope, message), ...rest);
    },
    warn(message, ...rest) {
      console.warn(format(scope, message), ...rest);
    },
    error(message, ...rest) {
      console.error(format(scope, message), ...rest);
    },
  };
}

export const logger = createLogger('app');
