package models

// Request body for all generate endpoints
type GenerateRequest struct {
	StartDate string `json:"startDate" binding:"required"`
	EndDate   string `json:"endDate"   binding:"required"`
}

// Kafka envelopes

type KafkaEnvelope struct {
	Event         string `json:"event"`
	CorrelationID string `json:"correlationId"`
	Payload       any    `json:"payload"`
}

type GenerateEvent struct {
	UserID    string `json:"userId"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

type GenerateProjectEvent struct {
	ProjectID string `json:"projectId"`
}

type TeamGenerateEvent struct {
	TeamID    string `json:"teamId"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

type DepartmentGenerateEvent struct {
	DepartmentID string `json:"departmentId"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
}

// Atomic report service response
type ReportServiceResponse struct {
	Success bool `json:"success"`
	Data    struct {
		ReportURL   string `json:"reportUrl"`
		ReportTitle string `json:"reportTitle"`
		TaskCount   int    `json:"taskCount"`
	} `json:"data"`
	Error any `json:"error,omitempty"`
}
