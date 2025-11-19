package config

import (
	"encoding/json"
	"os"
)

type APIConfig struct {
	Name     string `json:"name"`
	URL      string `json:"url"`
	Interval int    `json:"interval"`
	Timeout  int    `json:"timeout"`
	Method   string `json:"method"`
}

type Config struct {
	APIs []APIConfig `json:"apis"`
}

func Load(configPath string) (*Config, error) {
	file, err := os.Open(configPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	var config Config

	err = decoder.Decode(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
