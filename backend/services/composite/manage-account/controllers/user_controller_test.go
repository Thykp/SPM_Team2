package controllers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	profile_service "manage-account/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// ============================================================================
// Helper Functions
// ============================================================================

func setupGinContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	return c, w
}

func stringPtr(s string) *string {
	return &s
}

// ============================================================================
// Tests for GetUsers
// ============================================================================

func TestGetUsers(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/users", nil)

		originalGetAllUsers := GetAllUsersFunc
		defer func() { GetAllUsersFunc = originalGetAllUsers }()
		GetAllUsersFunc = func() ([]profile_service.User, error) {
			return []profile_service.User{
				{UserId: "1", UserName: stringPtr("Alice")},
				{UserId: "2", UserName: stringPtr("Bob")},
			}, nil
		}

		GetUsers(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "data")
		data := response["data"].([]interface{})
		assert.Len(t, data, 2)
	})

	t.Run("Error", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/users", nil)

		originalGetAllUsers := GetAllUsersFunc
		defer func() { GetAllUsersFunc = originalGetAllUsers }()
		GetAllUsersFunc = func() ([]profile_service.User, error) {
			return nil, errors.New("service error")
		}

		GetUsers(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "error")
		assert.Equal(t, "Failed to fetch users", response["error"])
	})
}

// ============================================================================
// Tests for GetUserByID
// ============================================================================

func TestGetUserByID(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		c, w := setupGinContext()

		users := []profile_service.User{{UserId: "1"}}
		body, _ := json.Marshal(users)
		c.Request = httptest.NewRequest("POST", "/users/details", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")

		originalGetUserDetails := GetUserDetailsFunc
		defer func() { GetUserDetailsFunc = originalGetUserDetails }()
		GetUserDetailsFunc = func(users []profile_service.User) []profile_service.User {
			return []profile_service.User{
				{UserId: "1", UserName: stringPtr("Alice")},
			}
		}

		GetUserByID(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var response []profile_service.User
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Len(t, response, 1)
		assert.Equal(t, "1", response[0].UserId)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		c, w := setupGinContext()

		c.Request = httptest.NewRequest("POST", "/users/details", bytes.NewReader([]byte("invalid json")))
		c.Request.Header.Set("Content-Type", "application/json")

		GetUserByID(c)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "error")
		assert.Equal(t, "Invalid JSON", response["error"])
	})
}

// ============================================================================
// Tests for GetAssignees
// ============================================================================

func TestGetAssignees(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/assignees?role=developer&team_id=team1&department_id=dept1", nil)

		originalGetAssignees := GetAssigneesFunc
		defer func() { GetAssigneesFunc = originalGetAssignees }()
		GetAssigneesFunc = func(role, teamID, departmentID string) ([]profile_service.User, error) {
			return []profile_service.User{
				{UserId: "1", UserName: stringPtr("Alice"), UserRole: stringPtr("developer")},
				{UserId: "2", UserName: stringPtr("Bob"), UserRole: stringPtr("developer")},
			}, nil
		}

		GetAssignees(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "data")
		data := response["data"].([]interface{})
		assert.Len(t, data, 2)
	})

	t.Run("Error", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/assignees?role=developer", nil)

		originalGetAssignees := GetAssigneesFunc
		defer func() { GetAssigneesFunc = originalGetAssignees }()
		GetAssigneesFunc = func(role, teamID, departmentID string) ([]profile_service.User, error) {
			return nil, errors.New("service error")
		}

		GetAssignees(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "error")
	})
}

// ============================================================================
// Tests for GetTeams
// ============================================================================

func TestGetTeams(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/teams", nil)

		originalGetTeams := GetTeamsFunc
		defer func() { GetTeamsFunc = originalGetTeams }()
		GetTeamsFunc = func() ([]profile_service.Team, error) {
			return []profile_service.Team{
				{ID: "team1", Name: "Team A", DepartmentID: "dept1"},
				{ID: "team2", Name: "Team B", DepartmentID: "dept2"},
			}, nil
		}

		GetTeams(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "data")
		data := response["data"].([]interface{})
		assert.Len(t, data, 2)
	})

	t.Run("Error", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/teams", nil)

		originalGetTeams := GetTeamsFunc
		defer func() { GetTeamsFunc = originalGetTeams }()
		GetTeamsFunc = func() ([]profile_service.Team, error) {
			return nil, errors.New("service error")
		}

		GetTeams(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "error")
	})
}

// ============================================================================
// Tests for GetDepartments
// ============================================================================

func TestGetDepartments(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/departments", nil)

		originalGetDepartments := GetDepartmentsFunc
		defer func() { GetDepartmentsFunc = originalGetDepartments }()
		GetDepartmentsFunc = func() ([]profile_service.Department, error) {
			return []profile_service.Department{
				{ID: "dept1", Name: "Department A"},
				{ID: "dept2", Name: "Department B"},
			}, nil
		}

		GetDepartments(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "data")
		data := response["data"].([]interface{})
		assert.Len(t, data, 2)
	})

	t.Run("Error", func(t *testing.T) {
		c, w := setupGinContext()
		c.Request = httptest.NewRequest("GET", "/departments", nil)

		originalGetDepartments := GetDepartmentsFunc
		defer func() { GetDepartmentsFunc = originalGetDepartments }()
		GetDepartmentsFunc = func() ([]profile_service.Department, error) {
			return nil, errors.New("service error")
		}

		GetDepartments(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response, "error")
	})
}
