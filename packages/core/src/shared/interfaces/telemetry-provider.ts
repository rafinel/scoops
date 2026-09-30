type OperationalOutcome = 'success' | 'failure'
type OperationalStatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
type OperationalHttpMethod =
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'DELETE'
type OperationalSignal = 'job_telemetry_failure'

type TelemetryContext = {
  route?: string
  method?: OperationalHttpMethod
  statusClass?: OperationalStatusClass
  functionId?: string
  signal?: OperationalSignal
  outcome?: OperationalOutcome
  durationMs?: number
  errorClass?: string
}

export interface TelemetryProvider {
  recordHttpRequest(input: {
    route: string
    method: OperationalHttpMethod
    statusClass: OperationalStatusClass
    durationMs: number
  }): void
  recordJobRun(input: {
    functionId: string
    outcome: OperationalOutcome
    durationMs: number
  }): void
  logWarning(context: TelemetryContext): void
  logError(context: TelemetryContext): void
  captureUnexpected(error: unknown, safeContext?: TelemetryContext): void
}
