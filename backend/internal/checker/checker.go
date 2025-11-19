package checker

import (
	"health-check-monitor/internal/retry"
	"net/http"
	"time"
)

type Result struct {
	Success   bool
	Latency   time.Duration
	Status    int
	Error     string
	Timestamp time.Time
}

type Checker struct {
	client *http.Client
}

func NewChecker(timeout time.Duration) *Checker {
	return &Checker{
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *Checker) Check(url string) Result {
	start := time.Now()
	resp, err := c.client.Get(url)
	latency := time.Since(start)

	if err != nil {
		return Result{
			Success:   false,
			Latency:   latency,
			Status:    0,
			Error:     err.Error(),
			Timestamp: time.Now(),
		}
	}
	defer resp.Body.Close()

	success := resp.StatusCode >= 200 && resp.StatusCode < 300

	return Result{
		Success:   success,
		Latency:   latency,
		Status:    resp.StatusCode,
		Error:     "",
		Timestamp: time.Now(),
	}
}

func (c *Checker) CheckWithRetry(url string, maxRetries int) Result {
	config := retry.DefaultRetryConfig()
	config.MaxRetries = maxRetries

	var bestResult Result
	bestResult.Success = false

	checkFn := func() bool {
		result := c.Check(url)
		if result.Success {
			bestResult = result
			return true
		}
		bestResult = result
		return false
	}

	success := retry.Execute(checkFn, config)
	bestResult.Success = success
	return bestResult
}
