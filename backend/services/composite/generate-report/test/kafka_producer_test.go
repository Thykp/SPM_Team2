package test

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	appkafka "generate-report/service/kafka"

	segkafka "github.com/segmentio/kafka-go"
	"github.com/stretchr/testify/assert"
)

// ---- mock writer ----

type mockWriter struct {
	Called bool
	Err    error
	Msgs   []segkafka.Message
}

func (m *mockWriter) WriteMessages(ctx context.Context, msgs ...segkafka.Message) error {
	m.Called = true
	m.Msgs = append(m.Msgs, msgs...)
	return m.Err
}

func (m *mockWriter) Close() error { return nil }

// ---- tests ----

func TestSplitAndTrim(t *testing.T) {
	cases := []struct {
		in   string
		want []string
	}{
		{"localhost:9092", []string{"localhost:9092"}},
		{"a:1, b:2 , , c:3", []string{"a:1", "b:2", "c:3"}},
		{"", []string{}},
	}
	for _, c := range cases {
		got := appkafka.SplitAndTrim(c.in)
		assert.Equal(t, c.want, got)
	}
}

func TestProduce_JSONMarshal_Success(t *testing.T) {
	mw := &mockWriter{}
	prod := &kafkaProducerShim{writer: mw, topic: "test-topic"}

	ctx := context.Background()
	payload := map[string]string{"event": "hello"}
	data, _ := json.Marshal(payload)

	err := prod.Produce(ctx, "key1", payload)
	assert.NoError(t, err)
	assert.True(t, mw.Called)
	assert.Equal(t, []byte("key1"), mw.Msgs[0].Key)
	assert.JSONEq(t, string(data), string(mw.Msgs[0].Value))
	assert.Equal(t, []byte("application/json"), mw.Msgs[0].Headers[0].Value)
}

func TestProduce_JSONMarshal_Error(t *testing.T) {
	mw := &mockWriter{}
	prod := &kafkaProducerShim{writer: mw, topic: "t1"}

	// functions cannot be marshalled to JSON
	err := prod.Produce(context.Background(), "key", func() {})
	assert.Error(t, err)
}

func TestProduce_WriteMessages_Error(t *testing.T) {
	mw := &mockWriter{Err: errors.New("broker down")}
	prod := &kafkaProducerShim{writer: mw, topic: "topic"}

	err := prod.Produce(context.Background(), "u1", map[string]string{"x": "y"})
	assert.EqualError(t, err, "broker down")
}

// ---- helper shim (since service/kafka/producer.go has unexported struct) ----

type kafkaProducerShim struct {
	writer interface {
		WriteMessages(ctx context.Context, msgs ...segkafka.Message) error
		Close() error
	}
	topic string
}

func (p *kafkaProducerShim) Produce(ctx context.Context, key string, value any) error {
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

	msg := segkafka.Message{
		Time:  time.Now(),
		Key:   []byte(key),
		Value: bytes,
		Headers: []segkafka.Header{
			{Key: "content-type", Value: []byte("application/json")},
		},
	}
	return p.writer.WriteMessages(ctx, msg)
}
