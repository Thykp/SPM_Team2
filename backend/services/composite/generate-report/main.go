package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"generate-report/middleware"
	"generate-report/routers"
	kafkaSvc "generate-report/service/kafka"
)

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	// ---- Config ----
	port := getenv("PORT", "8093")
	env := getenv("APP_ENV", "development") // development|production
	kafkaBrokers := getenv("KAFKA_BROKERS", "kafka:9092")
	kafkaTopic := getenv("KAFKA_TOPIC", "report-requests")
	reportBaseURL := getenv("REPORT_BASE_URL", "http://report:3042")

	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// ---- Kafka Producer (with topic ensure) ----
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	producer, err := kafkaSvc.NewKafkaProducer(ctx, kafkaBrokers, kafkaTopic)
	if err != nil {
		log.Fatalf("failed to init kafka producer: %v", err)
	}
	defer producer.Close()

	// ---- HTTP client (shared) ----
	httpClient := &http.Client{
		Timeout: 30 * time.Second,
	}

	// ---- Router ----
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestID())
	r.Use(middleware.ErrorHandler())

	routers.RegisterRoutes(r, producer, httpClient, reportBaseURL)

	log.Printf("generate-report up on :%s (env=%s)", port, env)
	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatal(err)
	}
}
