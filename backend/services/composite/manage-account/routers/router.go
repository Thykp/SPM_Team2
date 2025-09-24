package routers

import (
	"manage-account/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.GET("/health", controllers.HealthCheck)

	api := r.Group("/api")
	{
		users := api.Group("/users")
		{
			users.GET("", controllers.GetUsers)
			users.GET("/:userId", controllers.GetUserByID)
			users.POST("", controllers.CreateUser)
			users.PUT("/:id", controllers.UpdateUser)
			users.DELETE("/:id", controllers.DeleteUser)
		}
	}

	return r
}
