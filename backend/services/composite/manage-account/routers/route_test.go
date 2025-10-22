package routers

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestRouter(t *testing.T) {
    router := SetupRouter() // Assuming SetupRouter initializes the routes

    // Test a specific route
    req, _ := http.NewRequest("GET", "/health", nil)
    resp := httptest.NewRecorder()
    router.ServeHTTP(resp, req)

    if resp.Code != http.StatusOK {
        t.Errorf("Expected status 200, got %d", resp.Code)
    }
}