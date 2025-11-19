package retry

import (
	"math"
	"time"
)

type RetryConfig struct {
	MaxRetries       int
	InitialDelay     time.Duration
	MaxDelay         time.Duration
	BackoffMultiplier float64
}

func DefaultRetryConfig() RetryConfig {
	return RetryConfig{
		MaxRetries:       5,
		InitialDelay:     1 * time.Second,
		MaxDelay:         30 * time.Second,
		BackoffMultiplier: 2.0,
	}
}

type RetryableFunc func() bool

func Execute(fn RetryableFunc, config RetryConfig) bool {
	if fn() {
		return true
	}

	currentDelay := config.InitialDelay
	
	for attempt := 1; attempt < config.MaxRetries; attempt++ {
		time.Sleep(currentDelay)

		if fn() {
			return true
		}

		currentDelay = time.Duration(float64(currentDelay) * config.BackoffMultiplier)
		if currentDelay > config.MaxDelay {
			currentDelay = config.MaxDelay
		}
	}

	return false
}

func CalculateDelay(attempt int, config RetryConfig) time.Duration {
	delay := float64(config.InitialDelay) * math.Pow(config.BackoffMultiplier, float64(attempt-1))
	result := time.Duration(delay)
	
	if result > config.MaxDelay {
		result = config.MaxDelay
	}
	
	return result
}

