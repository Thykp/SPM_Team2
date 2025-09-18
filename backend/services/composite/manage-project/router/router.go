package router

import (
	"manage-project/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	api := router.Group("api")
	{
		project := api.Group("project")
		project.GET("/all", controllers.GetAllProjects)
		project.GET("/:userId", controllers.GetProjectsPerUser)
		project.PUT("/:projectId/collaborators", controllers.UpdateProjectCollaborators)
	}

	return router
}
