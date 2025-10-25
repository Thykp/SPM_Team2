package test

import (
	"net/http"
	"testing"

	"generate-report/pkg/httpx"

	"github.com/stretchr/testify/assert"
)

func TestNewClient(t *testing.T) {
	client := httpx.NewClient()
	assert.NotNil(t, client)
	assert.IsType(t, &http.Client{}, client)
}
