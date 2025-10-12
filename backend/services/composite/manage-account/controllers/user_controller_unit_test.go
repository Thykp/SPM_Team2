package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	profile_service "manage-account/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGetUsers_Success(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/users", nil)

	// Mock the service function
	originalGetAllUsers := GetAllUsersFunc
	defer func() { GetAllUsersFunc = originalGetAllUsers }()
	GetAllUsersFunc = func() ([]profile_service.User, error) {
		return []profile_service.User{
			{UserId: "1", UserName: stringPtr("Alice")},
			{UserId: "2", UserName: stringPtr("Bob")},
		}, nil
	}

	// Call the handler
	GetUsers(c)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "data")
	data := response["data"].([]interface{})
	assert.Len(t, data, 2)
}

func TestGetUsers_Error(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/users", nil)

	// Mock the service function to return error
	originalGetAllUsers := GetAllUsersFunc
	defer func() { GetAllUsersFunc = originalGetAllUsers }()
	GetAllUsersFunc = func() ([]profile_service.User, error) {
		return nil, assert.AnError // some error
	}

	// Call the handler
	GetUsers(c)

	// Assertions
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "error")
	assert.Equal(t, "Failed to fetch users", response["error"])
}

func TestGetUserByID_Success(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	users := []profile_service.User{{UserId: "1"}}
	body, _ := json.Marshal(users)
	c.Request = httptest.NewRequest("POST", "/users/details", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	// Mock the service function
	originalGetUserDetails := GetUserDetailsFunc
	defer func() { GetUserDetailsFunc = originalGetUserDetails }()
	GetUserDetailsFunc = func(users []profile_service.User) []profile_service.User {
		return []profile_service.User{
			{UserId: "1", UserName: stringPtr("Alice")},
		}
	}

	// Call the handler
	GetUserByID(c)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)
	var response []profile_service.User
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Len(t, response, 1)
	assert.Equal(t, "1", response[0].UserId)
}

func TestGetUserByID_InvalidJSON(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Invalid JSON
	c.Request = httptest.NewRequest("POST", "/users/details", bytes.NewReader([]byte("invalid json")))
	c.Request.Header.Set("Content-Type", "application/json")

	// Call the handler
	GetUserByID(c)

	// Assertions
	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "error")
	assert.Equal(t, "Invalid JSON", response["error"])
}

// Helper function
func stringPtr(s string) *string {
	return &s
}
