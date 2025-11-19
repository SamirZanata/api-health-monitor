<template>
  <div class="api-card" :class="{ 'down': status.status === 'down' }">
    <div class="api-header">
      <h3>{{ status.name }}</h3>
      <span class="status-badge" :class="status.status">
        <span class="status-dot"></span>
        {{ status.status === 'up' ? 'Operacional' : 'Indisponível' }}
      </span>
    </div>
    
    <div class="api-details">
      <div class="detail-item">
        <span class="label">Latência:</span>
        <span class="value">{{ formatLatency(status.latency) }}</span>
      </div>
      <div class="detail-item">
        <span class="label">Última verificação:</span>
        <span class="value">{{ formatTime(status.lastCheck) }}</span>
      </div>
      <div class="detail-item" v-if="totals">
        <span class="label">Total de checks:</span>
        <span class="value">{{ totals.up + totals.down }} ({{ totals.up }} UP / {{ totals.down }} DOWN)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { APIStatus } from '../types/prometheus';

interface Props {
  status: APIStatus;
  totals?: { up: number; down: number };
}

const props = defineProps<Props>();

function formatLatency(ms: number): string {
  if (ms === 0) return 'N/A';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}
</script>

<style scoped>
.api-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #10b981;
  transition: all 0.2s;
}

.api-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.api-card.down {
  border-left-color: #ef4444;
}

.api-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.api-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.025em;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-badge.up {
  background-color: #f0fdf4;
  color: #166534;
}

.status-badge.up .status-dot {
  background-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.status-badge.down {
  background-color: #fef2f2;
  color: #991b1b;
}

.status-badge.down .status-dot {
  background-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.api-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.label {
  color: #6b7280;
  font-size: 0.875rem;
}

.value {
  color: #111827;
  font-weight: 600;
  font-size: 0.875rem;
}
</style>

