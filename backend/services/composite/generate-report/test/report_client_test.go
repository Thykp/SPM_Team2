package test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"generate-report/models"
	"generate-report/service/report"
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

func TestReportClient_GenerateTeam(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/report/team/team-456", r.URL.Path)
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/team.pdf",
				ReportTitle: "Team Report",
				TaskCount:   15,
			},
		})
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	resp, status, err := client.GenerateTeam(context.Background(), "team-456", "2024-01-01", "2024-01-31", "user-123", "corr-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.True(t, resp.Success)
	assert.Equal(t, "https://cdn.example.com/team.pdf", resp.Data.ReportURL)
}

func TestReportClient_GenerateDepartment(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/report/department/dept-789", r.URL.Path)
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/dept.pdf",
				ReportTitle: "Department Report",
				TaskCount:   25,
			},
		})
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	resp, status, err := client.GenerateDepartment(context.Background(), "dept-789", "2024-01-01", "2024-01-31", "user-123", "corr-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.True(t, resp.Success)
}

func TestReportClient_GenerateOrganisation(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/report/organisation", r.URL.Path)
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/org.pdf",
				ReportTitle: "Organisation Report",
				TaskCount:   100,
			},
		})
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	resp, status, err := client.GenerateOrganisation(context.Background(), "2024-01-01", "2024-01-31", "user-123", "corr-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.True(t, resp.Success)
}

func TestReportClient_GenerateProjectReport(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/report/project/proj-abc", r.URL.Path)
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/proj.pdf",
				ReportTitle: "Project Report",
				TaskCount:   30,
			},
		})
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	resp, status, err := client.GenerateProjectReport(context.Background(), "proj-abc", "2024-01-01", "2024-01-31", "user-123", "corr-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.True(t, resp.Success)
}

func TestReportClient_GetByUser(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/report/profile/user-999", r.URL.Path)
		w.WriteHeader(200)
		json.NewEncoder(w).Encode([]models.ReportRecord{
			{
				ID:        "r1",
				ProfileID: "profile-1",
				Title:     "Report 1",
				Filepath:  "/path/to/r1.pdf",
				CreatedAt: "2024-01-01T00:00:00Z",
				UpdatedAt: "2024-01-01T00:00:00Z",
			},
		})
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	items, status, err := client.GetByUser(context.Background(), "user-999", "corr-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.Len(t, items, 1)
	assert.Equal(t, "r1", items[0].ID)
}

func TestReportClient_DeleteReport(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/report/r-123", r.URL.Path)
		assert.Equal(t, http.MethodDelete, r.Method)
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(map[string]any{
			"deleted": true,
		})
	}))
	defer srv.Close()

	client := report.NewClient(srv.Client(), srv.URL)
	result, status, err := client.DeleteReport(context.Background(), "r-123", "corr-1")

	assert.NoError(t, err)
	assert.Equal(t, 200, status)
	assert.NotNil(t, result)
}
