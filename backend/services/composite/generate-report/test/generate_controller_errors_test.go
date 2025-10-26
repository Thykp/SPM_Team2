package test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"generate-report/controllers"
	"generate-report/test/testutils"
)

func setupErrorRouter(ctrl *controllers.GenerateController) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) { c.Set("request_id", "req-err"); c.Next() })
	r.GET("/:userId", ctrl.GetReportsByUser)
	r.DELETE("/:reportId", ctrl.DeleteReport)
	r.POST("/report/:userId", ctrl.GeneratePersonal)
	r.POST("/report/team/:teamId", ctrl.GenerateTeam)
	r.POST("/report/department/:departmentId", ctrl.GenerateDepartment)
	r.POST("/report/project/:projectId", ctrl.GenerateProjectReport)
	r.POST("/report/organisation", ctrl.GenerateOrganisation)
	return r
}

func TestGeneratePersonal_KafkaError(t *testing.T) {
	mockProducer := &testutils.MockProducer{Err: errors.New("kafka down")}
	mockClient := &testutils.MockReportClient{}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{"startDate": "2024-01-01", "endDate": "2024-01-31"}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/u123", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGenerateTeam_ReportServiceError(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Err: errors.New("report svc down"),
	}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "u123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/team/team-123", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGenerateDepartment_KafkaError(t *testing.T) {
	mockProducer := &testutils.MockProducer{Err: errors.New("kafka down")}
	mockClient := &testutils.MockReportClient{}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "admin-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/department/dept-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGenerateDepartment_ReportServiceError(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Err: errors.New("report svc down"),
	}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "admin-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/department/dept-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGenerateProjectReport_KafkaError(t *testing.T) {
	mockProducer := &testutils.MockProducer{Err: errors.New("kafka down")}
	mockClient := &testutils.MockReportClient{}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "user-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/project/proj-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGenerateProjectReport_ReportServiceError(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Err: errors.New("report svc down"),
	}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "user-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/project/proj-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGenerateOrganisation_KafkaError(t *testing.T) {
	mockProducer := &testutils.MockProducer{Err: errors.New("kafka down")}
	mockClient := &testutils.MockReportClient{}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "admin-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/organisation", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGenerateOrganisation_ReportServiceError(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Err: errors.New("report svc down"),
	}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
		"userId":    "admin-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/organisation", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGeneratePersonal_ReportServiceError(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Err: errors.New("report service down"),
	}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	body := map[string]string{"startDate": "2024-01-01", "endDate": "2024-01-31"}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/u123", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
}

func TestGetReportsByUser_Error(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Err: errors.New("report service down"),
	}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	req := httptest.NewRequest("GET", "/user-123", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
	assert.Equal(t, "GetByUser", mockClient.CalledMethod)
}

func TestDeleteReport_Error(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Err: errors.New("report service down"),
	}
	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupErrorRouter(ctrl)

	req := httptest.NewRequest("DELETE", "/report-123", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadGateway, resp.Code)
	assert.Equal(t, "DeleteReport", mockClient.CalledMethod)
}
