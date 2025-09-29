package controllers

import (
	profile_service "manage-account/service"
	"net/http"
	"encoding/json"
	"github.com/gin-gonic/gin"
)

// var users = []map[string]interface{}{
// 	{"id": 1, "name": "Alice"},
// 	{"id": 2, "name": "Bob"},
// }

const profileServiceURL = "http://profile:3030/user"

func GetUsers(c *gin.Context) {

    // Call the profile microservice to fetch all users
    resp, err := http.Get(profileServiceURL)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
        return
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        c.JSON(resp.StatusCode, gin.H{"error": "failed to fetch users from profile service"})
        return
    }

    var users []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func GetUserByID(c *gin.Context) {
	var receivedUserArray []profile_service.User

	if err := c.BindJSON(&receivedUserArray); err != nil {
		return
	}

	response := profile_service.GetUserDetails(receivedUserArray)
	// if err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": err})
	// 	return
	// }
	c.IndentedJSON(http.StatusOK, response)
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
