package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
)

type Producer interface {
	Produce(ctx context.Context, key string, value any) error
	Close() error
}

type producer struct {
	writer *kafka.Writer
	topic  string
}

func NewKafkaProducer(ctx context.Context, brokersCSV string, topic string) (Producer, error) {
	brokers := splitAndTrim(brokersCSV)
	// Try to ensure the topic exists (best-effort).
	if err := ensureTopic(ctx, brokers[0], topic); err != nil {
		// Not fatal if broker refuses (e.g., permissions); we continue anyway.
		fmt.Printf("kafka: topic ensure failed (continuing): %v\n", err)
	}

	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Topic:        topic,
		Balancer:     &kafka.Hash{}, // partition by key (userId)
		RequiredAcks: kafka.RequireAll,
		Async:        false,
		BatchTimeout: 50 * time.Millisecond,
		// Leave BatchSize default
	}

	return &producer{writer: writer, topic: topic}, nil
}

func (p *producer) Produce(ctx context.Context, key string, value any) error {
	var bytes []byte
	var err error
	switch v := value.(type) {
	case []byte:
		bytes = v
	default:
		bytes, err = json.Marshal(v)
		if err != nil {
			return err
		}
	}
	msg := kafka.Message{
		Time:  time.Now(),
		Key:   []byte(key),
		Value: bytes,
		Headers: []kafka.Header{
			{Key: "content-type", Value: []byte("application/json")},
		},
	}
	return p.writer.WriteMessages(ctx, msg)
}

func (p *producer) Close() error {
	return p.writer.Close()
}

func splitAndTrim(csv string) []string {
	parts := strings.Split(csv, ",")
	out := make([]string, 0, len(parts))
	for _, s := range parts {
		s = strings.TrimSpace(s)
		if s != "" {
			out = append(out, s)
		}
	}
	return out
}

func ensureTopic(ctx context.Context, broker string, topic string) error {
	dialer := &kafka.Dialer{
		Timeout:   5 * time.Second,
		DualStack: true,
		Resolver:  &net.Resolver{},
	}
	conn, err := dialer.DialContext(ctx, "tcp", broker)
	if err != nil {
		return err
	}
	defer conn.Close()

	controller, err := conn.Controller()
	if err != nil {
		return err
	}
	controllerConn, err := dialer.DialContext(ctx, "tcp", net.JoinHostPort(controller.Host, fmt.Sprintf("%d", controller.Port)))
	if err != nil {
		return err
	}
	defer controllerConn.Close()

	configs := []kafka.TopicConfig{{
		Topic:             topic,
		NumPartitions:     1,
		ReplicationFactor: 1,
	}}
	return controllerConn.CreateTopics(configs...)
}
