package routers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"

	"generate-report/controllers"
	kafkaSvc "generate-report/service/kafka"
	"generate-report/service/report"
)

// main route setup used in production
func RegisterRoutes(r *gin.Engine, producer kafkaSvc.Producer, httpClient *http.Client, reportBaseURL string) {
	reportClient := report.NewClient(httpClient, reportBaseURL)
	ctrl := controllers.NewGenerateController(producer, reportClient)

	grp := r.Group("/")
	{
		grp.GET("/health", ctrl.Health)
		grp.GET("/:userId", ctrl.GetReportsByUser)
		grp.DELETE("/:reportId", ctrl.DeleteReport)
		grp.POST("/:userId", ctrl.GeneratePersonal)
		grp.POST("/project/:projectId", ctrl.GenerateProjectReport)
		grp.POST("/team/:teamId", ctrl.GenerateTeam)
		grp.POST("/department/:departmentId", ctrl.GenerateDepartment)
		grp.POST("/organisation", ctrl.GenerateOrganisation)
	}
}

// lightweight wrapper for tests
func RegisterSystemRoutes(r *gin.Engine) *gin.Engine {
	if r == nil {
		r = gin.New()
	}

	dummyProducer := &dummyKafkaProducer{}
	httpClient := &http.Client{}
	reportBaseURL := "http://localhost:9999"

	RegisterRoutes(r, dummyProducer, httpClient, reportBaseURL)
	return r
}

// ---- test stub producer ----
type dummyKafkaProducer struct{}

func (d *dummyKafkaProducer) Produce(ctx context.Context, key string, value any) error { return nil }
func (d *dummyKafkaProducer) Close() error                                             { return nil }
