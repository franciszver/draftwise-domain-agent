// Observability utilities for client-side metrics and logging

export interface MetricEvent {
  name: string;
  value: number;
  unit?: string;
  dimensions?: Record<string, string>;
  timestamp: string;
}

export interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

// Metric collection
const metricsQueue: MetricEvent[] = [];
const logsQueue: LogEvent[] = [];

const FLUSH_INTERVAL = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100;

// Initialize periodic flush
let flushInterval: ReturnType<typeof setInterval> | null = null;

export function initializeObservability(): void {
  if (flushInterval) return;
  
  flushInterval = setInterval(() => {
    flushMetrics();
    flushLogs();
  }, FLUSH_INTERVAL);

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushMetrics();
    flushLogs();
  });
}

export function shutdownObservability(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
  flushMetrics();
  flushLogs();
}

// Metrics
export function recordMetric(
  name: string,
  value: number,
  options?: { unit?: string; dimensions?: Record<string, string> }
): void {
  const event: MetricEvent = {
    name,
    value,
    unit: options?.unit,
    dimensions: options?.dimensions,
    timestamp: new Date().toISOString(),
  };

  metricsQueue.push(event);

  if (metricsQueue.length >= MAX_QUEUE_SIZE) {
    flushMetrics();
  }
}

export function recordTiming(
  name: string,
  startTime: number,
  dimensions?: Record<string, string>
): void {
  const duration = performance.now() - startTime;
  recordMetric(name, duration, { unit: 'milliseconds', dimensions });
}

// Pre-defined metrics
export const Metrics = {
  suggestionLatency: (ms: number) =>
    recordMetric('suggestion_latency', ms, { unit: 'milliseconds' }),
  
  apiRequestDuration: (endpoint: string, ms: number) =>
    recordMetric('api_request_duration', ms, {
      unit: 'milliseconds',
      dimensions: { endpoint },
    }),
  
  editorKeystroke: () =>
    recordMetric('editor_keystrokes', 1, { unit: 'count' }),
  
  documentSave: (documentId: string, isAutosave: boolean) =>
    recordMetric('document_saves', 1, {
      unit: 'count',
      dimensions: { document_id: documentId, auto_save: String(isAutosave) },
    }),
  
  sourceDiscoveryCount: (count: number) =>
    recordMetric('sources_discovered', count, { unit: 'count' }),
  
  shareLinksCreated: () =>
    recordMetric('share_links_created', 1, { unit: 'count' }),
};

// Logging
export function log(
  level: LogEvent['level'],
  message: string,
  context?: Record<string, unknown>
): void {
  const event: LogEvent = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  // Also log to console in development
  if (import.meta.env.DEV) {
    const logFn = level === 'error' ? console.error :
                  level === 'warn' ? console.warn :
                  level === 'debug' ? console.debug : console.log;
    logFn(`[${level.toUpperCase()}] ${message}`, context || '');
  }

  logsQueue.push(event);

  if (logsQueue.length >= MAX_QUEUE_SIZE) {
    flushLogs();
  }
}

// Convenience logging functions
export const Logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    log('error', message, context),
};

// Flush functions (would send to CloudWatch in production)
async function flushMetrics(): Promise<void> {
  if (metricsQueue.length === 0) return;

  const batch = metricsQueue.splice(0, metricsQueue.length);

  // In production, this would send to CloudWatch via API
  if (import.meta.env.DEV) {
    console.debug('[Observability] Flushing metrics:', batch.length);
  }

  // TODO: Implement actual CloudWatch submission
  // await fetch('/api/metrics', { method: 'POST', body: JSON.stringify(batch) });
}

async function flushLogs(): Promise<void> {
  if (logsQueue.length === 0) return;

  const batch = logsQueue.splice(0, logsQueue.length);

  // In production, this would send to CloudWatch Logs via API
  if (import.meta.env.DEV) {
    console.debug('[Observability] Flushing logs:', batch.length);
  }

  // TODO: Implement actual CloudWatch Logs submission
  // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(batch) });
}

// Performance monitoring
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    recordTiming(name, start);
  }
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    recordTiming(name, start);
  }
}

// Error tracking
export function trackError(error: Error, context?: Record<string, unknown>): void {
  Logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
  });
}

// User activity tracking
let lastActivityTime = Date.now();

export function trackUserActivity(): void {
  lastActivityTime = Date.now();
}

export function getIdleTime(): number {
  return Date.now() - lastActivityTime;
}

export function isUserIdle(thresholdMs: number = 300000): boolean {
  return getIdleTime() > thresholdMs;
}


