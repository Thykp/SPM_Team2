package spg32_test

import (
	"fmt"
	"manage-task/routers"
	"net/http/httptest"
	"testing"
)

func TestGetTaskPerUser(t *testing.T) {
	router := routers.SetUpRouter()
	recorder := httptest.NewRecorder()
	userId := "588fb335-9986-4c93-872e-6ef103c97f92"
	path := fmt.Sprintf("/api/task/%s", userId)
	router.ServeHTTP(recorder, httptest.NewRequest("GET", path, nil))
	t.Run("Returns 200 status code", func(t *testing.T) {
		if recorder.Code != 200 {
			t.Error("Expected 200, got ", recorder.Code)
		}
	})
	t.Run("Returns JSON response", func(t *testing.T) {
		contentType := recorder.Header().Get("Content-Type")
		if contentType != "application/json; charset=utf-8" {
			t.Error("Expected 'application/json, got ", contentType)
		}
	})
}
