<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>Histórico de Latência - {{ apiName }}</h3>
      <div v-if="chartData.datasets[0].data.length > 0" class="stats">
        <span class="stat-item">
          <strong>Média:</strong> {{ averageLatency }}ms
        </span>
        <span class="stat-item">
          <strong>Máxima:</strong> {{ maxLatency }}ms
        </span>
        <span class="stat-item">
          <strong>Mínima:</strong> {{ minLatency }}ms
        </span>
      </div>
    </div>
    <div v-if="loading" class="loading">Carregando dados...</div>
    <div v-else-if="chartData.labels.length === 0 || chartData.datasets[0].data.length === 0" class="no-data">
      <div class="no-data-icon"></div>
      <p class="no-data-title">Nenhum dado disponível</p>
      <p class="hint">Aguarde alguns minutos para que os dados históricos sejam coletados.</p>
      <p class="hint">O gráfico aparecerá automaticamente quando houver dados.</p>
    </div>
    <div v-else class="chart-wrapper">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import { fetchLatencyHistory } from '../services/prometheus';

Chart.register(...registerables);

interface Props {
  apiName: string;
  refreshInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  refreshInterval: 30000, // 30 segundos
});

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const loading = ref(true);
const chart = ref<Chart | null>(null);
const chartData = ref({
  labels: [] as string[],
  datasets: [{
    label: 'Latência (ms)',
    data: [] as number[],
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBackgroundColor: '#3b82f6',
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
  }],
});

const averageLatency = computed(() => {
  const data = chartData.value.datasets[0].data.filter(v => !isNaN(v) && isFinite(v));
  if (data.length === 0) return 0;
  const sum = data.reduce((a, b) => a + b, 0);
  const avg = sum / data.length;
  return isNaN(avg) ? 0 : Math.round(avg * 100) / 100;
});

const maxLatency = computed(() => {
  const data = chartData.value.datasets[0].data.filter(v => !isNaN(v) && isFinite(v));
  if (data.length === 0) return 0;
  const max = Math.max(...data);
  return isNaN(max) ? 0 : Math.round(max * 100) / 100;
});

const minLatency = computed(() => {
  const data = chartData.value.datasets[0].data.filter(v => !isNaN(v) && isFinite(v));
  if (data.length === 0) return 0;
  const min = Math.min(...data);
  return isNaN(min) ? 0 : Math.round(min * 100) / 100;
});

let refreshTimer: number | null = null;

async function loadData() {
  try {
    loading.value = true;
    const history = await fetchLatencyHistory(props.apiName, 30);
    
    if (history.length === 0) {
      chartData.value = { labels: [], datasets: chartData.value.datasets };
      if (chart.value) {
        chart.value.destroy();
        chart.value = null;
      }
      loading.value = false;
      return;
    }

    const validHistory = history.filter(item => 
      item.latency != null && 
      !isNaN(item.latency) && 
      isFinite(item.latency) && 
      item.latency >= 0
    );

    if (validHistory.length === 0) {
      chartData.value = { labels: [], datasets: chartData.value.datasets };
      if (chart.value) {
        chart.value.destroy();
        chart.value = null;
      }
      loading.value = false;
      return;
    }

    chartData.value.labels = validHistory.map((item) =>
      new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(item.time)
    );
    chartData.value.datasets[0].data = validHistory.map((item) => {
      const latency = Math.round(item.latency * 100) / 100;
      return isNaN(latency) ? 0 : latency;
    });
    
    if (validHistory.length === 1) {
      const point = validHistory[0];
      chartData.value.labels.unshift(
        new Intl.DateTimeFormat('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date(point.time.getTime() - 5000))
      );
      chartData.value.datasets[0].data.unshift(point.latency);
    }

    await nextTick();
    updateChart();
  } catch (error) {
    console.error('Erro ao carregar dados do gráfico:', error);
    if (chart.value) {
      chart.value.destroy();
      chart.value = null;
    }
  } finally {
    loading.value = false;
  }
}

function updateChart() {
  nextTick().then(() => {
    setTimeout(() => {
      if (!chartCanvas.value) {
        setTimeout(updateChart, 100);
        return;
      }

      // Sempre destrói o gráfico antigo antes de criar um novo
      if (chart.value) {
        chart.value.destroy();
        chart.value = null;
      }

      if (chartData.value.labels.length === 0 || chartData.value.datasets[0].data.length === 0) {
        return;
      }
      
      try {
        chart.value = new Chart(chartCanvas.value, {
      type: 'line',
      data: chartData.value,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                weight: '500',
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            displayColors: true,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `Latência: ${value.toFixed(2)} ms`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Latência (milissegundos)',
              font: {
                size: 12,
                weight: '600',
              },
              color: '#6b7280',
            },
            ticks: {
              callback: function(value) {
                return value + ' ms';
              },
              font: {
                size: 11,
              },
              color: '#6b7280',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
            },
          },
          x: {
            title: {
              display: true,
              text: 'Tempo',
              font: {
                size: 12,
                weight: '600',
              },
              color: '#6b7280',
            },
            ticks: {
              font: {
                size: 11,
              },
              color: '#6b7280',
              maxRotation: 45,
              minRotation: 0,
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
            },
          },
        },
      },
    });
      } catch (error) {
        console.error('Erro ao criar gráfico:', error);
        if (chart.value) {
          chart.value.destroy();
          chart.value = null;
        }
      }
    }, 100);
  });
}

onMounted(() => {
  loadData();
  refreshTimer = window.setInterval(loadData, props.refreshInterval);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  if (chart.value) {
    chart.value.destroy();
  }
});

watch(() => props.apiName, async (newApiName, oldApiName) => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  if (chart.value) {
    chart.value.destroy();
    chart.value = null;
  }
  
  chartData.value = {
    labels: [],
    datasets: [{
      label: 'Latência (ms)',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    }],
  };
  
  await loadData();
  refreshTimer = window.setInterval(loadData, props.refreshInterval);
});
</script>

<style scoped>
.chart-container {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 400px;
  height: auto;
}

.chart-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.chart-header h3 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-item strong {
  color: #111827;
  margin-right: 0.5rem;
  font-weight: 600;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #6b7280;
  font-size: 0.9375rem;
  font-weight: 500;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
}

.no-data-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  background: #f3f4f6;
  border-radius: 50%;
  position: relative;
}

.no-data-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border: 2px solid #9ca3af;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.no-data-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.no-data p {
  margin: 0.5rem 0;
  color: #6b7280;
}

.hint {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.chart-wrapper {
  position: relative;
  height: 350px;
  width: 100%;
}

canvas {
  max-height: 350px;
  height: 350px !important;
  width: 100% !important;
}
</style>

