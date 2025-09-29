/* eslint-disable no-console */
const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'debug' | 'warn' | 'error';

const formatMessage = (
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): string => {
  const timestamp = new Date().toISOString();
  const metaString = metadata ? ` ${JSON.stringify(metadata)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
};

const log = (
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
) => {
  if (isProduction) {
    return;
  }

  const formatted = formatMessage(level, message, metadata);

  switch (level) {
    case 'info':
      console.info(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
    default:
      console.log(formatted);
  }
};

export const appLogger = {
  info: (message: string, metadata?: Record<string, unknown>) =>
    log('info', message, metadata),
  debug: (message: string, metadata?: Record<string, unknown>) =>
    log('debug', message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) =>
    log('warn', message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) =>
    log('error', message, metadata),
};
