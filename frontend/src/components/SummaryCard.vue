<template>
  <div class="summary-card">
    <div class="summary-header">
      <h3>Resumo Geral</h3>
    </div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">{{ totalAPIs }}</div>
        <div class="stat-label">APIs Monitoradas</div>
      </div>
      <div class="stat-box up">
        <div class="stat-value">{{ upCount }}</div>
        <div class="stat-label">APIs Online</div>
      </div>
      <div class="stat-box down">
        <div class="stat-value">{{ downCount }}</div>
        <div class="stat-label">APIs Offline</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">{{ averageLatency }}ms</div>
        <div class="stat-label">Latência Média</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { APIStatus } from '../types/prometheus';

interface Props {
  statuses: APIStatus[];
}

const props = defineProps<Props>();

const totalAPIs = computed(() => props.statuses.length);

const upCount = computed(() => 
  props.statuses.filter(s => s.status === 'up').length
);

const downCount = computed(() => 
  props.statuses.filter(s => s.status === 'down').length
);

const averageLatency = computed(() => {
  const upStatuses = props.statuses.filter(s => s.status === 'up' && s.latency > 0);
  if (upStatuses.length === 0) return 0;
  const sum = upStatuses.reduce((acc, s) => acc + s.latency, 0);
  return Math.round(sum / upStatuses.length);
});
</script>

<style scoped>
.summary-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  grid-column: 1 / -1;
}

.summary-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.summary-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.025em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.2s;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-color: #d1d5db;
}

.stat-box.up {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.stat-box.up:hover {
  border-color: #86efac;
}

.stat-box.down {
  background: #fef2f2;
  border-color: #fecaca;
}

.stat-box.down:hover {
  border-color: #fca5a5;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #111827;
  letter-spacing: -0.025em;
}

.stat-box.up .stat-value {
  color: #166534;
}

.stat-box.down .stat-value {
  color: #991b1b;
}

.stat-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>

