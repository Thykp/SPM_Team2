package test

import (
	"errors"
	"net/http/httptest"
	"testing"

	"generate-report/middleware"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRequestIDMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.RequestID())
	r.GET("/ping", func(c *gin.Context) {
		c.String(200, c.GetString("request_id"))
	})

	req := httptest.NewRequest("GET", "/ping", nil)
	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)
	assert.Equal(t, 200, resp.Code)
	assert.NotEmpty(t, resp.Body.String())
}

func TestErrorMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// ✅ Recovery middleware must be registered BEFORE the panic route.
	r.Use(middleware.Recovery())

	// Route that intentionally panics
	r.GET("/panic", func(c *gin.Context) {
		panic(errors.New("boom"))
	})

	req := httptest.NewRequest("GET", "/panic", nil)
	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, 500, resp.Code)
	assert.Contains(t, resp.Body.String(), "boom")
}
