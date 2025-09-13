package manage_account_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"manage-account/routers"
)

func TestHealth_API_OK(t *testing.T) {
	r := routers.SetupRouter()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("want 200, got %d, body=%q", rr.Code, rr.Body.String())
	}
}
