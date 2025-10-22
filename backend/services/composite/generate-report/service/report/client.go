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
	Generate(ctx context.Context, userID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error)
	GenerateProjectReport(ctx context.Context, projectID, correlationID string) (models.ReportServiceResponse, int, error)
}

type client struct {
	http *http.Client
	base string
}

func NewClient(httpClient *http.Client, baseURL string) Client {
	return &client{http: httpClient, base: baseURL}
}

func (c *client) Generate(ctx context.Context, userID, startDate, endDate, correlationID string) (models.ReportServiceResponse, int, error) {
	body := map[string]string{
		"startDate": startDate,
		"endDate":   endDate,
	}
	buf, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/report/%s", c.base, userID), bytes.NewReader(buf))
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
	if err := json.Unmarshal(data, &parsed); err != nil {
		return models.ReportServiceResponse{}, resp.StatusCode, fmt.Errorf("report svc bad JSON: %w, raw=%s", err, string(data))
	}
	return parsed, resp.StatusCode, nil
}

func (c *client) GenerateProjectReport(ctx context.Context, projectID, correlationID string) (models.ReportServiceResponse, int, error) {
	// Trim whitespace from project ID
	projectID = strings.TrimSpace(projectID)
	
	// Send default date range (last 365 days to cover all recent activity)
	endDate := time.Now().Format("2006-01-02")
	startDate := time.Now().AddDate(-1, 0, 0).Format("2006-01-02") // 1 year ago
	
	body := map[string]string{
		"startDate": startDate,
		"endDate":   endDate,
	}
	buf, _ := json.Marshal(body)
	
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/report/project/%s", c.base, projectID), bytes.NewReader(buf))
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
	if err := json.Unmarshal(data, &parsed); err != nil {
		return models.ReportServiceResponse{}, resp.StatusCode, fmt.Errorf("report svc bad JSON: %w, raw=%s", err, string(data))
	}
	return parsed, resp.StatusCode, nil
}
