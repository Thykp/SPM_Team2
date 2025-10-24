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

		// fetch existing reports for a user
		grp.GET("/:userId", ctrl.GetReportsByUser)

		// Delete report
		grp.DELETE("/:reportId", ctrl.DeleteReport)

		// Personal report
		grp.POST("/:userId", ctrl.GeneratePersonal) // body: {startDate,endDate}

		// Project report
		grp.POST("/project/:projectId", ctrl.GenerateProjectReport) // No body required

		// Team report
		grp.POST("/team/:teamId", ctrl.GenerateTeam) // body: {startDate,endDate}

		// Department report
		grp.POST("/department/:departmentId", ctrl.GenerateDepartment) // body: {startDate,endDate}
	}
}
