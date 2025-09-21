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

func GetTaskByID(c *gin.Context) {
    taskID := c.Param("id") // Extract the task ID from the route parameter
    fmt.Println("Task ID received:", taskID) // Debug log

    task, err := task_service.GetTaskByID(taskID)
    if err != nil {
        fmt.Println("Error fetching task:", err) // Debug log
        c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Task not found"})
        return
    }

    fmt.Println("Task fetched successfully:", task) // Debug log
    c.IndentedJSON(http.StatusOK, task)
}
