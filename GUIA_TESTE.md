# Guia de Teste Completo

## Passo a Passo para Testar o Sistema

### Pré-requisitos
- Docker instalado e rodando
- Go instalado
- Node.js e npm instalados

---

## 1. Iniciar o Prometheus (Banco de Dados)

Abra um terminal e execute:

```bash
docker-compose up -d
```

**Verificar se está rodando:**
```bash
docker ps
```

Você deve ver o container `monitor-prometheus` rodando.

**Acesse:** http://localhost:9090

---

## 2. Iniciar o Backend (Go)

Abra um **novo terminal** e execute:

```bash
cd backend
go run main.go
```

**Você deve ver:**
```
Configuração carregada: 2 APIs para monitorar
Servidor de métricas iniciado em http://localhost:8080/metrics
Iniciando monitoramento de: Google (URL: https://www.google.com, Intervalo: 30s)
Iniciando monitoramento de: GitHub API (URL: https://api.github.com, Intervalo: 60s)
Todos os workers iniciados. Pressione Ctrl+C para parar.
```

**Verificar se está funcionando:**
- Acesse: http://localhost:8080/metrics
- Você deve ver métricas do Prometheus

**Aguarde alguns segundos** para os health checks executarem. Você verá logs como:
```
[14:30:25] Google - UP - Latência: 205ms - Status: 200
```

---

## 3. Iniciar o Frontend (Vue 3)

Abra um **terceiro terminal** e execute:

```bash
cd frontend
npm run dev
```

**Você deve ver:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Acesse:** http://localhost:5173

---

## 4. Testar no Navegador

### O que você deve ver:

1. **Header roxo** com título "Monitor de Integridade de APIs"

2. **Seção "Status das APIs"** com cards mostrando:
   - Google - UP
   - GitHub API - UP
   - Latência de cada uma
   - Última verificação
   - Total de checks

3. **Seção "Gráficos de Latência"** com:
   - Dropdown para selecionar API
   - Gráfico de linha mostrando latência ao longo do tempo

### O que testar:

1. **Verificar se os cards aparecem** com status UP/DOWN
2. **Verificar se a latência está sendo mostrada**
3. **Selecionar uma API no dropdown** e ver o gráfico
4. **Aguardar 15-30 segundos** e ver se atualiza automaticamente
5. **Verificar se o gráfico mostra dados históricos**

---

## 5. Verificar no Prometheus UI

Acesse: http://localhost:9090

1. Na barra de busca, digite: `health_check_status`
2. Clique em "Execute"
3. Você deve ver as métricas das APIs

**Queries úteis para testar:**
- `health_check_status` - Status atual
- `health_check_duration_seconds` - Latência
- `health_check_total` - Total de checks

---

## Troubleshooting

### Backend não inicia
- Verifique se a porta 8080 está livre
- Verifique se o `config.json` existe e está correto

### Prometheus não coleta métricas
- Verifique se o backend está rodando
- Verifique se `host.docker.internal:8080` está acessível
- No Prometheus UI, vá em Status > Targets e verifique se está "UP"

### Frontend não carrega dados
- Verifique se o Prometheus está rodando na porta 9090
- Abra o Console do navegador (F12) e verifique erros
- Verifique se há erros de CORS

### Gráfico não aparece
- Aguarde alguns minutos para ter dados históricos
- Verifique no Console se há erros do Chart.js

---

## Checklist Final

- [ ] Prometheus rodando (porta 9090)
- [ ] Backend rodando (porta 8080)
- [ ] Frontend rodando (porta 5173)
- [ ] Cards de status aparecendo
- [ ] Gráficos funcionando
- [ ] Atualização automática funcionando

---

## Pronto!

Se tudo estiver funcionando, você tem um sistema completo de monitoramento rodando!

