package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	HealthCheckDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "health_check_duration_seconds",
			Help:    "Tempo de resposta dos health checks em segundos",
			Buckets: []float64{0.1, 0.5, 1.0, 2.0, 5.0, 10.0},
		},
		[]string{"api_name", "status"},
	)

	HealthCheckStatus = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "health_check_status",
			Help: "Status do health check (1 = UP, 0 = DOWN)",
		},
		[]string{"api_name"},
	)

	HealthCheckTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "health_check_total",
			Help: "Total de health checks executados",
		},
		[]string{"api_name", "status"},
	)
)

func RecordHealthCheck(apiName string, success bool, latencySeconds float64) {
	status := "down"
	if success {
		status = "up"
	}

	HealthCheckDuration.WithLabelValues(apiName, status).Observe(latencySeconds)

	statusValue := 0.0
	if success {
		statusValue = 1.0
	}
	HealthCheckStatus.WithLabelValues(apiName).Set(statusValue)

	HealthCheckTotal.WithLabelValues(apiName, status).Inc()
}

