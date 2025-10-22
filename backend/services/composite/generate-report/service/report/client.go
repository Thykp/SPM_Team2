package report

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"generate-report/models"
)

type Client interface {
	// Personal
	Generate(ctx context.Context, userID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error)
	// Project
	GenerateProjectReport(ctx context.Context, projectID, correlationID string) (models.ReportServiceResponse, int, error)
	// Team
	GenerateTeam(ctx context.Context, teamID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error)
	// Department
	GenerateDepartment(ctx context.Context, departmentID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error)
}

type client struct {
	http *http.Client
	base string
}

func NewClient(httpClient *http.Client, baseURL string) Client {
	return &client{http: httpClient, base: baseURL}
}

// ----- helpers -----

func (c *client) doJSON(ctx context.Context, method, url, correlationID string, body any) (models.ReportServiceResponse, int, error) {
	var rdr io.Reader
	if body != nil {
		buf, _ := json.Marshal(body)
		rdr = bytes.NewReader(buf)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, rdr)
	if err != nil {
		return models.ReportServiceResponse{}, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	if correlationID != "" {
		req.Header.Set("X-Request-ID", correlationID)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return models.ReportServiceResponse{}, 0, err
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	var parsed models.ReportServiceResponse
	if len(data) > 0 {
		if err := json.Unmarshal(data, &parsed); err != nil {
			return models.ReportServiceResponse{}, resp.StatusCode, fmt.Errorf("report svc bad JSON: %w, raw=%s", err, string(data))
		}
	}
	return parsed, resp.StatusCode, nil
}

// ----- personal -----

func (c *client) Generate(ctx context.Context, userID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error) {
	userID = strings.TrimSpace(userID)
	url := fmt.Sprintf("%s/report/%s", c.base, userID) // atomic: POST /report/:userId
	body := map[string]string{"startDate": startDate, "endDate": endDate}
	return c.doJSON(ctx, http.MethodPost, url, correlationID, body)
}

// ----- project -----

func (c *client) GenerateProjectReport(ctx context.Context, projectID, correlationID string) (models.ReportServiceResponse, int, error) {
	// Trim whitespace from project ID
	projectID = strings.TrimSpace(projectID)

	// Send default date range (last 365 days to cover all recent activity)
	endDate := time.Now().Format("2006-01-02")
	startDate := time.Now().AddDate(-1, 0, 0).Format("2006-01-02") // 1 year ago

	url := fmt.Sprintf("%s/report/project/%s", c.base, projectID)
	body := map[string]string{"startDate": startDate, "endDate": endDate}
	return c.doJSON(ctx, http.MethodPost, url, correlationID, body)
}

// ----- team -----

func (c *client) GenerateTeam(ctx context.Context, teamID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error) {
	teamID = strings.TrimSpace(teamID)
	url := fmt.Sprintf("%s/report/team/%s", c.base, teamID) // atomic: POST /report/team/:teamId
	body := map[string]string{"startDate": startDate, "endDate": endDate}
	return c.doJSON(ctx, http.MethodPost, url, correlationID, body)
}

// ----- department -----

func (c *client) GenerateDepartment(ctx context.Context, departmentID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error) {
	departmentID = strings.TrimSpace(departmentID)
	url := fmt.Sprintf("%s/report/department/%s", c.base, departmentID) // atomic: POST /report/department/:departmentId
	body := map[string]string{"startDate": startDate, "endDate": endDate}
	return c.doJSON(ctx, http.MethodPost, url, correlationID, body)
}
