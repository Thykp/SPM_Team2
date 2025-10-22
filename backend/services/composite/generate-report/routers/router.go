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

	grp := r.Group("/")
	{
		// Health
		grp.GET("/health", ctrl.Health)

		// Personal report
		grp.POST("/:userId", ctrl.GeneratePersonal) // body: {startDate,endDate}

		// Team report
		grp.POST("/team/:teamId", ctrl.GenerateTeam) // body: {startDate,endDate}

		// Department report
		grp.POST("/department/:departmentId", ctrl.GenerateDepartment) // body: {startDate,endDate}
	}
}
