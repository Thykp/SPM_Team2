package test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"generate-report/models"
	"generate-report/service/report"

	"github.com/stretchr/testify/assert"
)

func TestReportClient_Generate(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/report/user-123", r.URL.Path)
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/x.pdf",
				ReportTitle: "User Report",
				TaskCount:   8,
			},
		})
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	resp, status, err := client.Generate(context.Background(), "user-123", "2024-01-01", "2024-01-31", "corr-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.True(t, resp.Success)
	assert.Equal(t, "https://cdn.example.com/x.pdf", resp.Data.ReportURL)
	assert.Equal(t, "User Report", resp.Data.ReportTitle)
}
