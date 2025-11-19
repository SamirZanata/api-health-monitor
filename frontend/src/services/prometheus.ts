import axios from 'axios';
import type { PrometheusResponse, PrometheusRangeResponse, APIStatus } from '../types/prometheus';

const PROMETHEUS_URL = import.meta.env.DEV ? '' : 'http://localhost:9090';

export async function fetchAPIStatuses(): Promise<APIStatus[]> {
  try {
    const url = `${PROMETHEUS_URL}/api/v1/query?query=health_check_status`;
    const response = await axios.get<PrometheusResponse>(url);

    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    const statuses: APIStatus[] = response.data.data.result
      .map((metric) => {
        const statusValue = parseFloat(String(metric.value[1]));
        const timestamp = parseInt(String(metric.value[0]));
        const lastCheckTime = timestamp * 1000;

        return {
          name: metric.metric.api_name,
          status: statusValue === 1 ? 'up' : 'down',
          latency: 0,
          lastCheck: new Date(lastCheckTime),
          lastCheckTime,
        };
      })
      .filter((status) => {
        const isRecent = status.lastCheckTime > fiveMinutesAgo;
        if (!isRecent) {
          console.log(`API "${status.name}" não foi atualizada recentemente, ignorando...`);
        }
        return isRecent;
      })
      .map(({ lastCheckTime, ...status }) => status);

    const latencyPromises = statuses.map(async (status) => {
      try {
        const latencyQuery = `health_check_duration_seconds_sum{api_name="${status.name}"} / health_check_duration_seconds_count{api_name="${status.name}"}`;
        const latencyResponse = await axios.get<PrometheusResponse>(
          `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(latencyQuery)}`
        );

        if (latencyResponse?.data?.data?.result && latencyResponse.data.data.result.length > 0) {
          const latest = latencyResponse.data.data.result[0];
          if (latest && latest.value && latest.value.length >= 2) {
            const latencySeconds = parseFloat(String(latest.value[1]));
            if (!isNaN(latencySeconds) && isFinite(latencySeconds) && latencySeconds >= 0) {
              status.latency = latencySeconds * 1000;
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao buscar latência para ${status.name}:`, error);
      }
      return status;
    });

    return Promise.all(latencyPromises);
  } catch (error) {
    console.error('Erro ao buscar status das APIs:', error);
    return [];
  }
}

export async function fetchLatencyHistory(apiName: string, minutes: number = 30): Promise<Array<{ time: Date; latency: number }>> {
  try {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (minutes * 60);

    const directQuery = `health_check_duration_seconds_sum{api_name="${apiName}"} / health_check_duration_seconds_count{api_name="${apiName}"}`;
    const url = `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(directQuery)}&start=${startTime}&end=${endTime}&step=15`;
    
    let response;
    try {
      response = await axios.get<PrometheusRangeResponse>(url);
    } catch (error) {
      const rateQuery = `rate(health_check_duration_seconds_sum{api_name="${apiName}"}[1m]) / rate(health_check_duration_seconds_count{api_name="${apiName}"}[1m])`;
      const rateUrl = `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(rateQuery)}&start=${startTime}&end=${endTime}&step=15`;
      try {
        response = await axios.get<PrometheusRangeResponse>(rateUrl);
      } catch (rateError) {
        response = { data: { data: { result: [] } } };
      }
    }

    if (response?.data?.data?.result && response.data.data.result.length > 0) {
      const values = response.data.data.result[0]?.values || [];
      if (values.length > 0) {
        return values
          .map(([timestamp, value]: [number, string]) => {
            const latency = parseFloat(value);
            if (isNaN(latency) || !isFinite(latency) || latency < 0) {
              return null;
            }
            return {
              time: new Date(timestamp * 1000),
              latency: latency * 1000,
            };
          })
          .filter((item): item is { time: Date; latency: number } => item !== null);
      }
    }

    const currentUrl = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(directQuery)}`;
    
    try {
      const currentResponse = await axios.get<PrometheusResponse>(currentUrl);

      if (currentResponse?.data?.data?.result && currentResponse.data.data.result.length > 0) {
        const metric = currentResponse.data.data.result[0];
        if (metric && metric.value && metric.value.length >= 2) {
          const timestamp = parseInt(String(metric.value[0]));
          const latency = parseFloat(String(metric.value[1])) * 1000;
          
          if (!isNaN(latency) && isFinite(latency) && latency >= 0) {
            return [{
              time: new Date(timestamp * 1000),
              latency: latency,
            }];
          }
        }
      }
    } catch (rateError) {
      // Continua para o fallback
    }

    const fallbackQuery = `health_check_duration_seconds_sum{api_name="${apiName}"} / health_check_duration_seconds_count{api_name="${apiName}"}`;
    const fallbackUrl = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(fallbackQuery)}`;
    
    try {
      const fallbackResponse = await axios.get<PrometheusResponse>(fallbackUrl);
      
      if (fallbackResponse?.data?.data?.result && fallbackResponse.data.data.result.length > 0) {
        const metric = fallbackResponse.data.data.result[0];
        if (metric && metric.value && metric.value.length >= 2) {
          const timestamp = parseInt(String(metric.value[0]));
          const latency = parseFloat(String(metric.value[1])) * 1000;
          
          if (!isNaN(latency) && isFinite(latency) && latency >= 0) {
            return [{
              time: new Date(timestamp * 1000),
              latency: latency,
            }];
          }
        }
      }
    } catch (fallbackError) {
      console.error('Fallback falhou:', fallbackError);
    }

    return [];
  } catch (error) {
    console.error(`Erro ao buscar histórico de latência para ${apiName}:`, error);
    if (error instanceof Error) {
      console.error('Detalhes:', error.message);
    }
    return [];
  }
}

export async function fetchTotalChecks(apiName: string): Promise<{ up: number; down: number }> {
  try {
    const upUrl = `${PROMETHEUS_URL}/api/v1/query?query=health_check_total{api_name="${apiName}",status="up"}`;
    const downUrl = `${PROMETHEUS_URL}/api/v1/query?query=health_check_total{api_name="${apiName}",status="down"}`;
    const upResponse = await axios.get<PrometheusResponse>(upUrl);
    const downResponse = await axios.get<PrometheusResponse>(downUrl);

    const up = (upResponse?.data?.data?.result && upResponse.data.data.result.length > 0 && upResponse.data.data.result[0]?.value)
      ? parseFloat(String(upResponse.data.data.result[0].value[1]))
      : 0;
    const down = (downResponse?.data?.data?.result && downResponse.data.data.result.length > 0 && downResponse.data.data.result[0]?.value)
      ? parseFloat(String(downResponse.data.data.result[0].value[1]))
      : 0;

    return { up, down };
  } catch (error) {
    console.error(`Erro ao buscar total de checks para ${apiName}:`, error);
    return { up: 0, down: 0 };
  }
}

