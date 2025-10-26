package testutils

import (
	"context"

	"generate-report/models"
)

// --- Mock Kafka Producer ---

type MockProducer struct {
	Called bool
	Err    error
	Key    string
	Event  any
}

func (m *MockProducer) Produce(ctx context.Context, key string, event any) error {
	m.Called = true
	m.Key = key
	m.Event = event
	return m.Err
}

func (m *MockProducer) Close() error {
	return nil
}

// --- Mock Report Client ---

type MockReportClient struct {
	CalledMethod string
	Resp         models.ReportServiceResponse
	Status       int
	Err          error
}

func (m *MockReportClient) Generate(ctx context.Context, userID, start, end, corr string) (models.ReportServiceResponse, int, error) {
	m.CalledMethod = "Generate"
	return m.Resp, m.Status, m.Err
}

func (m *MockReportClient) GenerateProjectReport(ctx context.Context, projectID, start, end, userID, corr string) (models.ReportServiceResponse, int, error) {
	m.CalledMethod = "GenerateProjectReport"
	return m.Resp, m.Status, m.Err
}

func (m *MockReportClient) GenerateTeam(ctx context.Context, teamID, start, end, userID, corr string) (models.ReportServiceResponse, int, error) {
	m.CalledMethod = "GenerateTeam"
	return m.Resp, m.Status, m.Err
}

func (m *MockReportClient) GenerateDepartment(ctx context.Context, deptID, start, end, userID, corr string) (models.ReportServiceResponse, int, error) {
	m.CalledMethod = "GenerateDepartment"
	return m.Resp, m.Status, m.Err
}

// NEW: satisfy expanded interface
func (m *MockReportClient) GenerateOrganisation(ctx context.Context, start, end, userID, corr string) (models.ReportServiceResponse, int, error) {
	m.CalledMethod = "GenerateOrganisation"
	return m.Resp, m.Status, m.Err
}

func (m *MockReportClient) GetByUser(ctx context.Context, userID, corr string) ([]models.ReportRecord, int, error) {
	m.CalledMethod = "GetByUser"
	// Return empty slice by default; propagate Status/Err if set.
	status := m.Status
	if status == 0 {
		status = 200
	}
	return []models.ReportRecord{}, status, m.Err
}

func (m *MockReportClient) DeleteReport(ctx context.Context, reportID, corr string) (map[string]any, int, error) {
	m.CalledMethod = "DeleteReport"
	status := m.Status
	if status == 0 {
		status = 200
	}
	return map[string]any{"deleted": m.Err == nil}, status, m.Err
}
