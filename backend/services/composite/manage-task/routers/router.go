package routers

import (
	"manage-task/controllers"

	"github.com/gin-gonic/gin"
)

func SetUpRouter() *gin.Engine {
	router := gin.Default()
	router.GET("/health", controllers.HealthCheck)
	api := router.Group("/api")
	{
		task := api.Group("/task")
		task.GET("/:user_id", controllers.GetTasksPerUser)
		task.GET("/id/:id", controllers.GetTaskByID)
	}
	return router
}