package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"health-check-monitor/internal/checker"
	"health-check-monitor/internal/config"
	"health-check-monitor/internal/metrics"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	cfg, err := config.Load("config.json")
	if err != nil {
		log.Fatalf("Erro ao carregar configuração: %v", err)
	}

	fmt.Printf("✅ Configuração carregada: %d APIs para monitorar\n", len(cfg.APIs))

	chk := checker.NewChecker(10 * time.Second)

	http.Handle("/metrics", promhttp.Handler())

	go func() {
		fmt.Println("🚀 Servidor de métricas iniciado em http://localhost:8080/metrics")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Fatalf("Erro ao iniciar servidor HTTP: %v", err)
		}
	}()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup

	for _, apiConfig := range cfg.APIs {
		wg.Add(1)
		go monitorAPI(ctx, &wg, chk, apiConfig)
	}

	fmt.Println("✅ Todos os workers iniciados. Pressione Ctrl+C para parar.")
	wg.Wait()
}

func monitorAPI(ctx context.Context, wg *sync.WaitGroup, chk *checker.Checker, apiConfig config.APIConfig) {
	defer wg.Done()

	ticker := time.NewTicker(time.Duration(apiConfig.Interval) * time.Second)
	defer ticker.Stop()

	fmt.Printf("📊 Iniciando monitoramento de: %s (URL: %s, Intervalo: %ds)\n",
		apiConfig.Name, apiConfig.URL, apiConfig.Interval)

	for {
		select {
		case <-ctx.Done():
			fmt.Printf("⏹️  Parando monitoramento de: %s\n", apiConfig.Name)
			return

		case <-ticker.C:
			executeHealthCheck(chk, apiConfig)
		}
	}
}

func executeHealthCheck(chk *checker.Checker, apiConfig config.APIConfig) {
	result := chk.CheckWithRetry(apiConfig.URL, 3)
	latencySeconds := result.Latency.Seconds()
	metrics.RecordHealthCheck(apiConfig.Name, result.Success, latencySeconds)

	status := "❌ DOWN"
	if result.Success {
		status = "✅ UP"
	}

	fmt.Printf("[%s] %s - %s - Latência: %v - Status: %d\n",
		time.Now().Format("15:04:05"),
		apiConfig.Name,
		status,
		result.Latency,
		result.Status,
	)
}
