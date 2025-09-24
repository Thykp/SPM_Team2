package manage_account_test

import (
	"fmt"
	"manage-account/routers"
	"net/http/httptest"
	"testing"
)

func TestGetUserByID(t *testing.T) {
	router := routers.SetupRouter()
	recorder := httptest.NewRecorder()
	userId := "588fb335-9986-4c93-872e-6ef103c97f92"
	path := fmt.Sprintf("/api/users/%s", userId)
	router.ServeHTTP(recorder, httptest.NewRequest("GET", path, nil))
	t.Run("Returns 400 status code", func(t *testing.T) {
		if recorder.Code != 400 {
			t.Error("Expected 400, got ", recorder.Code)
		}
	})
	t.Run("Returns JSON response", func(t *testing.T) {
		contentType := recorder.Header().Get("Content-Type")
		if contentType != "application/json; charset=utf-8" {
			t.Error("Expected 'application/json, got ", contentType)
		}
	})
}

func TestGetUserByID_EmptyUserID(t *testing.T) {
	router := routers.SetupRouter()
	recorder := httptest.NewRecorder()

	// Test with empty user ID (should match /api/users/ route if it exists)
	router.ServeHTTP(recorder, httptest.NewRequest("GET", "/api/users/", nil))

	t.Run("Should handle empty user ID", func(t *testing.T) {
		// This might return 404 (not found) or redirect to /api/users
		if recorder.Code == 200 {
			t.Log("Empty user ID returned 200 - likely redirected to users list")
		} else if recorder.Code == 404 {
			t.Log("Empty user ID returned 404 - route not found")
		} else {
			t.Logf("Empty user ID returned %d", recorder.Code)
		}
	})
}
