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

func TestCloneHeaders(t *testing.T) {
	src := make(http.Header)
	src.Set("Authorization", "Bearer token123")
	src.Set("Content-Type", "application/json")
	src.Add("X-Header", "value1")
	src.Add("X-Header", "value2")

	dst := httpx.CloneHeaders(src)

	assert.Equal(t, src.Get("Authorization"), dst.Get("Authorization"))
	assert.Equal(t, src.Get("Content-Type"), dst.Get("Content-Type"))
	assert.Equal(t, src.Values("X-Header"), dst.Values("X-Header"))
	
	// Modify original to verify independence
	src.Set("Authorization", "Bearer different-token")
	assert.NotEqual(t, src.Get("Authorization"), dst.Get("Authorization"))
	assert.Equal(t, "Bearer token123", dst.Get("Authorization"))
}

func TestCloneHeaders_Empty(t *testing.T) {
	src := make(http.Header)
	dst := httpx.CloneHeaders(src)

	assert.NotNil(t, dst)
	assert.Equal(t, 0, len(dst))
}

func TestCloneHeaders_Independence(t *testing.T) {
	src := make(http.Header)
	src.Set("Key", "value1")
	
	dst := httpx.CloneHeaders(src)
	
	// Modify cloned header
	dst.Set("Key", "value2")
	
	// Original should be unchanged
	assert.Equal(t, "value1", src.Get("Key"))
	assert.Equal(t, "value2", dst.Get("Key"))
}