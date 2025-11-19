// Tipos TypeScript para as respostas do Prometheus

export interface PrometheusMetric {
  metric: {
    __name__: string;
    api_name: string;
    instance?: string;
    job?: string;
    status?: string;
  };
  value: [number, string]; // [timestamp, value]
}

export interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: PrometheusMetric[];
  };
}

// Para query_range, o formato é diferente
export interface PrometheusRangeResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: {
        __name__?: string;
        api_name?: string;
        [key: string]: string | undefined;
      };
      values: Array<[number, string]>; // [timestamp, value]
    }>;
  };
}

export interface APIStatus {
  name: string;
  status: 'up' | 'down';
  latency: number;
  lastCheck: Date;
  statusCode?: number;
}

