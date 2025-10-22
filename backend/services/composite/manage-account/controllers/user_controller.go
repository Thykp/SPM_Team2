package controllers

import (
	profile_service "manage-account/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Function variables for testability
var GetAllUsersFunc = profile_service.GetAllUsers
var GetUserDetailsFunc = profile_service.GetUserDetails
var GetAssigneesFunc = profile_service.GetAssignees
var GetTeamsFunc = profile_service.GetTeams
var GetDepartmentsFunc = profile_service.GetDepartments

// var users = []map[string]interface{}{
// 	{"id": 1, "name": "Alice"},
// 	{"id": 2, "name": "Bob"},
// }

func GetUsers(c *gin.Context) {

	users, err := GetAllUsersFunc()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func GetUserByID(c *gin.Context) {
	var receivedUserArray []profile_service.User

	if err := c.BindJSON(&receivedUserArray); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	response := GetUserDetailsFunc(receivedUserArray)
	// if err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": err})
	// 	return
	// }
	c.IndentedJSON(http.StatusOK, response)
}

// GetAssignees handles requests to fetch assignees based on role, team_id, and department_id
func GetAssignees(c *gin.Context) {
	role := c.Query("role")
	teamID := c.Query("team_id")
	departmentID := c.Query("department_id")

	// Call the service to fetch assignees
	assignees, err := GetAssigneesFunc(role, teamID, departmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return the assignees as JSON
	c.JSON(http.StatusOK, gin.H{"data": assignees})
}

// GetTeams handles requests to fetch all teams
func GetTeams(c *gin.Context) {
	// Call the service to fetch teams
	teams, err := GetTeamsFunc()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return the teams as JSON
	c.JSON(http.StatusOK, gin.H{"data": teams})
}

// GetDepartments handles requests to fetch all departments
func GetDepartments(c *gin.Context) {
	// Call the service to fetch departments
	departments, err := GetDepartmentsFunc()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return the departments as JSON
	c.JSON(http.StatusOK, gin.H{"data": departments})
}

// CreateUser handles POST /api/users
// func CreateUser(c *gin.Context) {
// 	var newUser struct {
// 		Name string `json:"name" binding:"required"`
// 	}
// 	if err := c.ShouldBindJSON(&newUser); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}
// 	id := len(users) + 1
// 	user := map[string]interface{}{"id": id, "name": newUser.Name}
// 	users = append(users, user)
// 	c.JSON(http.StatusCreated, gin.H{"data": user})
// }

// UpdateUser handles PUT /api/users/:id
// func UpdateUser(c *gin.Context) {
// 	id, err := strconv.Atoi(c.Param("id"))
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
// 		return
// 	}
// 	var payload struct {
// 		Name string `json:"name" binding:"required"`
// 	}
// 	if err := c.ShouldBindJSON(&payload); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}
// 	for i, u := range users {
// 		if u["id"].(int) == id {
// 			users[i]["name"] = payload.Name
// 			c.JSON(http.StatusOK, gin.H{"data": users[i]})
// 			return
// 		}
// 	}
// 	c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
// }

// DeleteUser handles DELETE /api/users/:id
// func DeleteUser(c *gin.Context) {
// 	id, err := strconv.Atoi(c.Param("id"))
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
// 		return
// 	}
// 	for i, u := range users {
// 		if u["id"].(int) == id {
// 			users = append(users[:i], users[i+1:]...)
// 			c.Status(http.StatusNoContent)
// 			return
// 		}
// 	}
// 	c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
// }
