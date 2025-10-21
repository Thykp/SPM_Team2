package models

type GenerateRequest struct {
	StartDate string `json:"startDate" binding:"required"`
	EndDate   string `json:"endDate"   binding:"required"`
}

type KafkaEnvelope struct {
	Event         string        `json:"event"`
	CorrelationID string        `json:"correlationId"`
	Payload       GenerateEvent `json:"payload"`
}

type GenerateEvent struct {
	UserID    string `json:"userId"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

type ReportServiceResponse struct {
	Success bool `json:"success"`
	Data    struct {
		ReportURL   string `json:"reportUrl"`
		ReportTitle string `json:"reportTitle"`
		TaskCount   int    `json:"taskCount"`
	} `json:"data"`
	Error any `json:"error,omitempty"`
}
