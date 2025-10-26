package test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"generate-report/service/report"

	"github.com/stretchr/testify/assert"
)

func TestReportClient_BadJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte(`not-json`))
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	_, status, err := client.Generate(context.Background(), "u1", "2024-01-01", "2024-01-31", "req-1")

	assert.Error(t, err)
	assert.Equal(t, 200, status)
}

func TestReportClient_HTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	_, status, err := client.Generate(context.Background(), "u1", "2024-01-01", "2024-01-31", "req-2")

	assert.NoError(t, err)
	assert.Equal(t, 500, status)
}

func TestReportClient_GetByUser_BadJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte(`not-json`))
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	_, status, err := client.GetByUser(context.Background(), "u1", "req-1")

	assert.Error(t, err)
	assert.Equal(t, 200, status)
}

func TestReportClient_DeleteReport_NonJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte(`plain text`))
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	result, status, err := client.DeleteReport(context.Background(), "r-1", "req-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.NotNil(t, result)
}

func TestReportClient_GenerateTeam_BadJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte(`not-json`))
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	_, status, err := client.GenerateTeam(context.Background(), "team-1", "2024-01-01", "2024-01-31", "user-1", "req-1")

	assert.Error(t, err)
	assert.Equal(t, 200, status)
}

func TestReportClient_GenerateProjectReport_HTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	_, status, err := client.GenerateProjectReport(context.Background(), "proj-1", "2024-01-01", "2024-01-31", "user-1", "req-1")

	assert.NoError(t, err)
	assert.Equal(t, 500, status)
}
