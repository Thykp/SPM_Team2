package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthCheck responds with a simple status.
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "Server is running!",
	})
}
