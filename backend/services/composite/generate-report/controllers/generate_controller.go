package controllers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"generate-report/models"
	kafkaSvc "generate-report/service/kafka"
	"generate-report/service/report"
)

type GenerateController struct {
	producer     kafkaSvc.Producer
	reportClient report.Client
}

func NewGenerateController(p kafkaSvc.Producer, rc report.Client) *GenerateController {
	return &GenerateController{producer: p, reportClient: rc}
}

func (g *GenerateController) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "generate-report"})
}

// ===== Personal =====

func (g *GenerateController) GeneratePersonal(c *gin.Context) {
	userID := c.Param("userId")
	reqID := c.GetString("request_id")

	var req models.GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_BODY",
				"message": err.Error(),
			},
		})
		return
	}

	// 1) Publish Kafka event
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	env := models.KafkaEnvelope{
		Event:         "REPORT_REQUESTED",
		CorrelationID: reqID,
		Payload: models.GenerateEvent{
			UserID:    userID,
			StartDate: req.StartDate,
			EndDate:   req.EndDate,
		},
	}
	if err := g.producer.Produce(ctx, userID, env); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "KAFKA_PUBLISH_FAILED",
				"message": err.Error(),
			},
		})
		return
	}

	// 2) Call atomic/report synchronously
	callCtx, cancel2 := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel2()
	resp, status, err := g.reportClient.Generate(callCtx, userID, req.StartDate, req.EndDate, reqID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "REPORT_SERVICE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.Header("X-Request-ID", reqID)
	c.JSON(status, resp)
}

// ===== Team =====

func (g *GenerateController) GenerateTeam(c *gin.Context) {
	teamID := c.Param("teamId")
	reqID := c.GetString("request_id")

	var req models.GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_BODY",
				"message": err.Error(),
			},
		})
		return
	}

	// 1) Publish Kafka event
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	env := models.KafkaEnvelope{
		Event:         "TEAM_REPORT_REQUESTED",
		CorrelationID: reqID,
		Payload: models.TeamGenerateEvent{
			TeamID:    teamID,
			StartDate: req.StartDate,
			EndDate:   req.EndDate,
		},
	}
	if err := g.producer.Produce(ctx, teamID, env); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "KAFKA_PUBLISH_FAILED",
				"message": err.Error(),
			},
		})
		return
	}

	// 2) Call atomic/report synchronously
	callCtx, cancel2 := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel2()
	resp, status, err := g.reportClient.GenerateTeam(callCtx, teamID, req.StartDate, req.EndDate, reqID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "REPORT_SERVICE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.Header("X-Request-ID", reqID)
	c.JSON(status, resp)
}

// ===== Department =====

func (g *GenerateController) GenerateDepartment(c *gin.Context) {
	deptID := c.Param("departmentId")
	reqID := c.GetString("request_id")

	var req models.GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_BODY",
				"message": err.Error(),
			},
		})
		return
	}

	// 1) Publish Kafka event
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	env := models.KafkaEnvelope{
		Event:         "DEPARTMENT_REPORT_REQUESTED",
		CorrelationID: reqID,
		Payload: models.DepartmentGenerateEvent{
			DepartmentID: deptID,
			StartDate:    req.StartDate,
			EndDate:      req.EndDate,
		},
	}
	if err := g.producer.Produce(ctx, deptID, env); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "KAFKA_PUBLISH_FAILED",
				"message": err.Error(),
			},
		})
		return
	}

	// 2) Call atomic/report synchronously
	callCtx, cancel2 := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel2()
	resp, status, err := g.reportClient.GenerateDepartment(callCtx, deptID, req.StartDate, req.EndDate, reqID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "REPORT_SERVICE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.Header("X-Request-ID", reqID)
	c.JSON(status, resp)
}

func (g *GenerateController) GenerateProjectReport(c *gin.Context) {
	projectID := strings.TrimSpace(c.Param("projectId"))
	reqID := c.GetString("request_id")

	// 1) Publish Kafka event (best-effort; fail => return 502)
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	env := models.KafkaEnvelope{
		Event:         "PROJECT_REPORT_REQUESTED",
		CorrelationID: reqID,
		Payload: models.GenerateProjectEvent{
			ProjectID: projectID,
		},
	}
	if err := g.producer.Produce(ctx, projectID, env); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "KAFKA_PUBLISH_FAILED",
				"message": err.Error(),
			},
		})
		return
	}

	// 2) Call atomic/report project endpoint synchronously
	callCtx, cancel2 := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel2()
	resp, status, err := g.reportClient.GenerateProjectReport(callCtx, projectID, reqID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "REPORT_SERVICE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	// Pass-through atomic/report response (with correlation ID)
	c.Header("X-Request-ID", reqID)
	c.JSON(status, resp)
}
