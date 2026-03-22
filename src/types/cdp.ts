export type RawDebuggerTarget = {
  type?: string;
  title?: string;
  url?: string;
  webSocketDebuggerUrl?: string;
  [key: string]: unknown;
};

export type DiscoveryErrorReason = "timeout" | "request-error" | "invalid-json";

export type DiscoveryError = {
  port: number;
  reason: DiscoveryErrorReason;
  message: string;
};

export type DiscoveredWindowTarget = {
  id: string;
  type: string;
  title: string;
  url?: string;
  port: number;
  host: "127.0.0.1";
  webSocketDebuggerUrl: string;
};

export type DiscoveryResult = {
  targets: DiscoveredWindowTarget[];
  errors: DiscoveryError[];
};

export type CdpExecutionContext = {
  id: number;
  origin: string;
  name: string;
  auxData?: Record<string, unknown>;
};

export type CdpCallParams = Record<string, unknown>;

export type CdpConnection = {
  readonly wsUrl: string;
  readonly contexts: CdpExecutionContext[];
  readonly rootContextId?: number;
  call<T = unknown>(method: string, params?: CdpCallParams): Promise<T>;
  close(): Promise<void>;
};
