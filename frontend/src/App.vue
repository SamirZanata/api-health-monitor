<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1>Monitor de Integridade</h1>
        <p class="subtitle">Sistema de monitoramento em tempo real</p>
      </div>
    </header>

    <main class="main-content">
      <section class="status-section">
        <h2>Status das APIs</h2>
        <div v-if="loading" class="loading">Carregando...</div>
        <div v-else class="api-grid">
          <SummaryCard :statuses="apiStatuses" />
          <APIStatusCard
            v-for="status in apiStatuses"
            :key="status.name"
            :status="status"
            :totals="totalsMap[status.name]"
          />
        </div>
      </section>

      <section class="charts-section" v-if="selectedApi && apiStatuses.length > 0">
        <h2>Gráficos de Latência</h2>
        <div class="chart-selector">
          <label for="api-select">Selecione uma API:</label>
          <select id="api-select" v-model="selectedApi" class="select">
            <option v-for="status in apiStatuses" :key="status.name" :value="status.name">
              {{ status.name }}
            </option>
          </select>
        </div>
        <LatencyChart :api-name="selectedApi" />
      </section>
      <section v-else-if="!loading && apiStatuses.length === 0" class="error-section">
        <div class="error-icon"></div>
        <h2>Nenhuma API encontrada</h2>
        <p>Verifique se:</p>
        <ul>
          <li>O backend está rodando na porta 8080</li>
          <li>O Prometheus está rodando na porta 9090</li>
          <li>As métricas estão sendo coletadas</li>
        </ul>
        <p class="error-hint">Abra o Console do navegador (F12) para ver mais detalhes.</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import APIStatusCard from './components/APIStatusCard.vue';
import LatencyChart from './components/LatencyChart.vue';
import SummaryCard from './components/SummaryCard.vue';
import { fetchAPIStatuses, fetchTotalChecks } from './services/prometheus';
import type { APIStatus } from './types/prometheus';

const apiStatuses = ref<APIStatus[]>([]);
const loading = ref(true);
const selectedApi = ref<string>('');
const totalsMap = ref<Record<string, { up: number; down: number }>>({});

let refreshTimer: number | null = null;

async function loadData() {
  try {
    loading.value = true;
    const statuses = await fetchAPIStatuses();
    apiStatuses.value = statuses;

    if (!selectedApi.value && statuses.length > 0) {
      selectedApi.value = statuses[0].name;
    }

    const totalsPromises = statuses.map(async (status) => {
      const totals = await fetchTotalChecks(status.name);
      totalsMap.value[status.name] = totals;
    });

    await Promise.all(totalsPromises);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
  refreshTimer = window.setInterval(loadData, 15000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f9fafb;
  color: #111827;
  line-height: 1.6;
}

.app {
  min-height: 100vh;
}

.header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 1.5rem 2rem;
}

.header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 400;
  margin: 0;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}

.status-section,
.charts-section {
  margin-bottom: 3rem;
}

.status-section h2,
.charts-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #111827;
  letter-spacing: -0.025em;
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  font-size: 0.9375rem;
  font-weight: 500;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

@media (max-width: 768px) {
  .api-grid {
    grid-template-columns: 1fr;
  }
}

.chart-selector {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chart-selector label {
  font-weight: 500;
  color: #374151;
}

.select {
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 200px;
}

.select:hover {
  border-color: #9ca3af;
}

.select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-section {
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 1px solid #e5e7eb;
}

.error-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1.5rem;
  background: #fee2e2;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon::before,
.error-icon::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 2px;
  background: #ef4444;
  border-radius: 1px;
}

.error-icon::before {
  transform: rotate(45deg);
}

.error-icon::after {
  transform: rotate(-45deg);
}

.error-section h2 {
  color: #111827;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-section p {
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.error-section ul {
  text-align: left;
  display: inline-block;
  margin: 1.5rem 0;
  list-style: none;
  padding: 0;
}

.error-section li {
  margin: 0.75rem 0;
  color: #6b7280;
  font-size: 0.9375rem;
  padding-left: 1.5rem;
  position: relative;
}

.error-section li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #9ca3af;
  font-weight: bold;
}

.error-hint {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #9ca3af;
}
</style>
