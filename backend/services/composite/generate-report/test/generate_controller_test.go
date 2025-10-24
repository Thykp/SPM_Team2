package test

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"generate-report/controllers"
	"generate-report/models"
	"generate-report/test/testutils"
)

func setupRouter(ctrl *controllers.GenerateController) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("request_id", "test-req-id")
		c.Next()
	})

	r.POST("/report/:userId", ctrl.GeneratePersonal)
	r.POST("/report/team/:teamId", ctrl.GenerateTeam)
	r.POST("/report/department/:departmentId", ctrl.GenerateDepartment)
	r.POST("/report/project/:projectId", ctrl.GenerateProjectReport)
	return r
}

func TestGeneratePersonal_Success(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Resp: models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/r.pdf",
				ReportTitle: "Personal Report",
				TaskCount:   5,
			},
		},
		Status: 200,
		Err:    nil,
	}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{"startDate": "2024-01-01", "endDate": "2024-01-31"}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/user-123", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
	assert.True(t, mockProducer.Called)
	assert.Equal(t, "Generate", mockClient.CalledMethod)
}

func TestGeneratePersonal_InvalidBody(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("POST", "/report/u1", bytes.NewReader([]byte(`{invalid`)))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateTeam_MissingUserID(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{"startDate": "2024-01-01", "endDate": "2024-01-31"}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/team/team-123", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, 400, resp.Code)
}

func TestGenerateTeam_Success(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Resp: models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/team.pdf",
				ReportTitle: "Team Report",
				TaskCount:   12,
			},
		},
		Status: 200,
	}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "u123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/team/team-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
	assert.Equal(t, "GenerateTeam", mockClient.CalledMethod)
	assert.True(t, mockProducer.Called)
}
