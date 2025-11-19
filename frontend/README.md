# Frontend - Monitor de Integridade de APIs

Frontend desenvolvido com Vue 3 + TypeScript para visualizar métricas do Prometheus.

## 🚀 Como executar

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse no navegador: http://localhost:5173

## 📦 Tecnologias

- **Vue 3** - Framework JavaScript reativo
- **TypeScript** - Tipagem estática
- **Chart.js** - Gráficos de latência
- **Axios** - Requisições HTTP
- **Vite** - Build tool rápida

## 🏗️ Estrutura

```
src/
├── components/        # Componentes Vue
│   ├── APIStatusCard.vue    # Card de status de cada API
│   └── LatencyChart.vue     # Gráfico de latência
├── services/          # Serviços
│   └── prometheus.ts        # API do Prometheus
├── types/            # Tipos TypeScript
│   └── prometheus.ts        # Tipos das respostas
├── App.vue           # Componente principal
├── main.ts           # Ponto de entrada
└── style.css         # Estilos globais
```

## 🔌 Requisitos

- Backend Go rodando na porta 8080
- Prometheus rodando na porta 9090
