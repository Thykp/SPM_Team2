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
	r.POST("/report/:userId", ctrl.GeneratePersonal)
	r.POST("/report/team/:teamId", ctrl.GenerateTeam)
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
