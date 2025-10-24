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

func (m *MockReportClient) GetByUser(ctx context.Context, userID, corr string) ([]models.ReportRecord, int, error) {
	m.CalledMethod = "GetByUser"
	return nil, 200, nil
}

func (m *MockReportClient) DeleteReport(ctx context.Context, reportID, corr string) (map[string]any, int, error) {
	m.CalledMethod = "DeleteReport"
	return map[string]any{"deleted": true}, 200, nil
}

func (m *MockProducer) Close() error {
	return nil
}
