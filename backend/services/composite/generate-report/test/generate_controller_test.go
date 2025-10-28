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

	r.GET("/health", ctrl.Health)
	r.GET("/:userId", ctrl.GetReportsByUser)
	r.DELETE("/:reportId", ctrl.DeleteReport)
	r.POST("/report/:userId", ctrl.GeneratePersonal)
	r.POST("/report/team/:teamId", ctrl.GenerateTeam)
	r.POST("/report/department/:departmentId", ctrl.GenerateDepartment)
	r.POST("/report/project/:projectId", ctrl.GenerateProjectReport)
	r.POST("/report/organisation", ctrl.GenerateOrganisation)
	return r
}

func TestHealth(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("GET", "/health", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
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

func TestGenerateOrganisation_Success(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Resp: models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/organisation.pdf",
				ReportTitle: "Organisation Report",
				TaskCount:   100,
			},
		},
		Status: 200,
	}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

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

	assert.Equal(t, 200, resp.Code)
	assert.Equal(t, "GenerateOrganisation", mockClient.CalledMethod)
	assert.True(t, mockProducer.Called)
}

func TestGenerateOrganisation_MissingDates(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{
		"userId": "admin-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/organisation", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateOrganisation_MissingUserID(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/organisation", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateOrganisation_InvalidBody(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("POST", "/report/organisation", bytes.NewReader([]byte(`{invalid`)))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateDepartment_Success(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Resp: models.ReportServiceResponse{
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
		},
		Status: 200,
	}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

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

	assert.Equal(t, 200, resp.Code)
	assert.Equal(t, "GenerateDepartment", mockClient.CalledMethod)
	assert.True(t, mockProducer.Called)
}

func TestGenerateDepartment_MissingUserID(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/department/dept-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateDepartment_InvalidBody(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("POST", "/report/department/dept-1", bytes.NewReader([]byte(`{invalid`)))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateProjectReport_Success(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Resp: models.ReportServiceResponse{
			Success: true,
			Data: struct {
				ReportURL   string `json:"reportUrl"`
				ReportTitle string `json:"reportTitle"`
				TaskCount   int    `json:"taskCount"`
			}{
				ReportURL:   "https://cdn.example.com/project.pdf",
				ReportTitle: "Project Report",
				TaskCount:   30,
			},
		},
		Status: 200,
	}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

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

	assert.Equal(t, 200, resp.Code)
	assert.Equal(t, "GenerateProjectReport", mockClient.CalledMethod)
	assert.True(t, mockProducer.Called)
}

func TestGenerateProjectReport_MissingDates(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{
		"userId": "user-123",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/project/proj-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateProjectReport_MissingUserID(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	body := map[string]string{
		"startDate": "2024-01-01",
		"endDate":   "2024-01-31",
	}
	data, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/report/project/proj-1", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGenerateProjectReport_InvalidBody(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("POST", "/report/project/proj-1", bytes.NewReader([]byte(`{invalid`)))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}

func TestGetReportsByUser_Success(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Status: 200,
		Err:    nil,
	}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("GET", "/user-123", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
	assert.Equal(t, "GetByUser", mockClient.CalledMethod)
}

func TestDeleteReport_Success(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{
		Status: 200,
		Err:    nil,
	}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("DELETE", "/report-123", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
	assert.Equal(t, "DeleteReport", mockClient.CalledMethod)
}

func TestGenerateTeam_InvalidBody(t *testing.T) {
	mockProducer := &testutils.MockProducer{}
	mockClient := &testutils.MockReportClient{}

	ctrl := controllers.NewGenerateController(mockProducer, mockClient)
	router := setupRouter(ctrl)

	req := httptest.NewRequest("POST", "/report/team/team-123", bytes.NewReader([]byte(`{invalid`)))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, 400, resp.Code)
}
