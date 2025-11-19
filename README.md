# API Health Monitor

Sistema completo de monitoramento de health checks para APIs e microserviços com visualização em tempo real, métricas Prometheus e dashboard interativo.

**Repositório:** [https://github.com/SamirZanata/api-health-monitor](https://github.com/SamirZanata/api-health-monitor)

## Sobre o Projeto

Este projeto monitora o status, latência e uptime de múltiplas APIs/microserviços, fornecendo:
- Health checks periódicos
- Gráficos de latência em tempo real
- Retry automático com backoff exponencial
- Métricas coletadas pelo Prometheus
- Dashboard visual moderno

## Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │──────▶│  Prometheus  │◀─────│   Backend   │
│  (Vue 3)   │       │  (Port 9090) │      │    (Go)     │
│  (Port 5173)│      └──────────────┘      │  (Port 8080) │
└─────────────┘                             └─────────────┘
```

## Como Executar

### 1. Backend (Go)

```bash
cd backend
go run main.go
```

O backend estará disponível em: http://localhost:8080/metrics

### 2. Prometheus

```bash
docker-compose up -d
```

O Prometheus estará disponível em: http://localhost:9090

### 3. Frontend (Vue 3)

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:5173

## Estrutura do Projeto

```
Monitor de Integridade/
├── backend/              # Backend Go
│   ├── internal/
│   │   ├── checker/     # Health checks
│   │   ├── config/       # Configuração
│   │   ├── metrics/      # Métricas Prometheus
│   │   └── retry/        # Retry logic
│   ├── config.json       # APIs para monitorar
│   └── main.go           # Ponto de entrada
├── frontend/             # Frontend Vue 3
│   ├── src/
│   │   ├── components/   # Componentes Vue
│   │   ├── services/      # Serviços API
│   │   └── types/         # Tipos TypeScript
│   └── package.json
├── prometheus/           # Config do Prometheus
│   └── prometheus.yml
└── docker-compose.yml     # Docker Compose
```

## Configuração

### Adicionar APIs para Monitorar

Edite `backend/config.json`:

```json
{
  "apis": [
    {
      "name": "Minha API",
      "url": "https://api.exemplo.com/health",
      "interval": 30,
      "timeout": 5,
      "method": "GET"
    }
  ]
}
```

## Tecnologias

### Backend
- **[Go](https://golang.org/)** - Linguagem de programação para alta performance
- **[Prometheus Client](https://github.com/prometheus/client_golang)** - Biblioteca para exposição de métricas
- **Goroutines** - Concorrência nativa do Go

### Frontend
- **[Vue 3](https://vuejs.org/)** - Framework JavaScript reativo
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática para JavaScript
- **[Chart.js](https://www.chartjs.org/)** - Biblioteca de gráficos interativos
- **[Axios](https://axios-http.com/)** - Cliente HTTP baseado em Promises

### Infraestrutura
- **[Prometheus](https://prometheus.io/)** - Sistema de monitoramento e alertas
- **[Docker](https://www.docker.com/)** - Containerização e orquestração

## Funcionalidades

- **Health Checks Periódicos** - Monitoramento automático com intervalos configuráveis
- **Gráficos de Latência** - Visualização histórica em tempo real com Chart.js
- **Retry Inteligente** - Retry automático com backoff exponencial para maior confiabilidade
- **Status Visual** - Dashboard com indicadores visuais de status (UP/DOWN)
- **Métricas Detalhadas** - Uptime, total de checks, latência média/máxima/mínima
- **Atualização em Tempo Real** - Refresh automático a cada 15 segundos
- **Múltiplas APIs** - Suporte para monitoramento simultâneo de várias APIs
- **Prometheus Integration** - Métricas expostas no formato Prometheus

## Estrutura de Métricas

O sistema expõe as seguintes métricas Prometheus:

- `health_check_status` - Status atual da API (1 = UP, 0 = DOWN)
- `health_check_duration_seconds` - Histograma de latência
- `health_check_total` - Contador total de health checks executados

## Requisitos

- Go 1.25+ 
- Node.js 18+
- Docker e Docker Compose
- Navegador moderno (Chrome, Firefox, Edge)

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto é um exemplo educacional.

---

## Tecnologias Utilizadas

<div align="center">

### Backend

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg" alt="Go" width="120" height="120" style="margin: 20px;"/>

### Frontend

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original-wordmark.svg" alt="Vue.js" width="120" height="120" style="margin: 20px;"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" width="120" height="120" style="margin: 20px;"/>

### Infraestrutura

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original-wordmark.svg" alt="Prometheus" width="120" height="120" style="margin: 20px;"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original-wordmark.svg" alt="Docker" width="120" height="120" style="margin: 20px;"/>

</div>

