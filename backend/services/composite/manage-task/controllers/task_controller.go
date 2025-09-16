package controllers

import (
	"fmt"
	task_service "manage-task/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetTasksPerUser(c *gin.Context) {
	userIdInput := c.Param("user_id")
	response, err := task_service.GetTaskBasedOnUser(userIdInput)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
	c.IndentedJSON(http.StatusOK, response)
}

func SampleGetTaskPerUser(c *gin.Context) {
	id := c.Param("user_id")
	resString := fmt.Sprintf("Sent ID: %s", id)
	c.IndentedJSON(http.StatusOK, resString)
}
