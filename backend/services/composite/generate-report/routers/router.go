package routers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"generate-report/controllers"
	kafkaSvc "generate-report/service/kafka"
	"generate-report/service/report"
)

func RegisterRoutes(r *gin.Engine, producer kafkaSvc.Producer, httpClient *http.Client, reportBaseURL string) {
	reportClient := report.NewClient(httpClient, reportBaseURL)
	ctrl := controllers.NewGenerateController(producer, reportClient)

	grp := r.Group("/generate-report")
	{
		grp.GET("/health", ctrl.Health)
		grp.POST("/:userId", ctrl.Generate) // body: {startDate,endDate}
	}
}
