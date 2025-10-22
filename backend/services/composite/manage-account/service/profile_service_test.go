package profile_service

import (
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"sync"
	"testing"
)

// ============================================================================
// Helper Functions
// ============================================================================

func createTestUser(id, name, dept, team, role, teamName, deptName string) User {
	return User{
		UserId:             id,
		UserName:           &name,
		UserDepartmentId:   &dept,
		UserTeamId:         &team,
		UserRole:           &role,
		UserTeamName:       &teamName,
		UserDepartmentName: &deptName,
	}
}

func createMockProfileServer(responses map[string]User, allUsers []User) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/user/all" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(allUsers)
			return
		}
		if len(r.URL.Path) > 6 && r.URL.Path[:6] == "/user/" {
			userId := r.URL.Path[6:]
			if user, exists := responses[userId]; exists {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(user)
			} else {
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(User{})
			}
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
}

func setupMockServer(t *testing.T, responses map[string]User, allUsers []User) func() {
	t.Helper()

	server := createMockProfileServer(responses, allUsers)
	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	origAddr := userServiceAddress
	origPort := userServicePort

	userServiceAddress = "http://" + host
	userServicePort = port

	return func() {
		server.Close()
		userServiceAddress = origAddr
		userServicePort = origPort
	}
}

func setupInvalidServer(t *testing.T) func() {
	t.Helper()

	origAddr := userServiceAddress
	origPort := userServicePort

	userServiceAddress = "http://invalid-host-that-does-not-exist"
	userServicePort = 99999

	return func() {
		userServiceAddress = origAddr
		userServicePort = origPort
	}
}

func setupInvalidJSONServer(t *testing.T, path string) func() {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == path {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("invalid json{{{"))
		}
	}))

	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	origAddr := userServiceAddress
	origPort := userServicePort

	userServiceAddress = "http://" + host
	userServicePort = port

	return func() {
		server.Close()
		userServiceAddress = origAddr
		userServicePort = origPort
	}
}

func setupErrorServer(t *testing.T, path string, statusCode int) func() {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == path {
			w.WriteHeader(statusCode)
		}
	}))

	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	origAddr := userServiceAddress
	origPort := userServicePort

	userServiceAddress = "http://" + host
	userServicePort = port

	return func() {
		server.Close()
		userServiceAddress = origAddr
		userServicePort = origPort
	}
}

func setupCustomServer(t *testing.T, handler http.HandlerFunc) func() {
	t.Helper()

	server := httptest.NewServer(handler)
	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	origAddr := userServiceAddress
	origPort := userServicePort

	userServiceAddress = "http://" + host
	userServicePort = port

	return func() {
		server.Close()
		userServiceAddress = origAddr
		userServicePort = origPort
	}
}

// ============================================================================
// Tests for UserDetailsBasedOnId
// ============================================================================

func TestUserDetailsBasedOnId(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		responses := map[string]User{
			"user1": createTestUser("user1", "Alice", "dept1", "team1", "role1", "Team A", "Dept A"),
		}
		cleanup := setupMockServer(t, responses, nil)
		defer cleanup()

		var wg sync.WaitGroup
		ch := make(chan User, 1)
		wg.Add(1)

		result, err := UserDetailsBasedOnId("user1", ch, &wg)
		wg.Wait()
		close(ch)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result == nil {
			t.Fatal("Expected non-nil result")
		}
		if result.UserId != "user1" {
			t.Errorf("Unexpected user: %+v", result)
		}

		select {
		case user := <-ch:
			if user.UserId != "user1" {
				t.Errorf("Channel user mismatch: %+v", user)
			}
		default:
			t.Error("Expected user in channel")
		}
	})

	t.Run("NotFound", func(t *testing.T) {
		cleanup := setupMockServer(t, map[string]User{}, nil)
		defer cleanup()

		var wg sync.WaitGroup
		ch := make(chan User, 1)
		wg.Add(1)

		result, err := UserDetailsBasedOnId("nonexistent", ch, &wg)
		wg.Wait()
		close(ch)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result == nil {
			t.Fatal("Expected non-nil result")
		}
		if result.UserId != "" {
			t.Errorf("Expected empty user, got %+v", result)
		}

		select {
		case user := <-ch:
			if user.UserId != "" {
				t.Errorf("Expected empty user in channel, got %+v", user)
			}
		default:
			t.Error("Expected user in channel")
		}
	})

	t.Run("ConnectionError", func(t *testing.T) {
		cleanup := setupInvalidServer(t)
		defer cleanup()

		var wg sync.WaitGroup
		ch := make(chan User, 1)
		wg.Add(1)

		result, err := UserDetailsBasedOnId("user1", ch, &wg)
		wg.Wait()
		close(ch)

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
		if result != nil {
			t.Errorf("Expected nil result, got %+v", result)
		}
	})

	t.Run("DecodeError", func(t *testing.T) {
		cleanup := setupCustomServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("invalid json{{{"))
		}))
		defer cleanup()

		var wg sync.WaitGroup
		ch := make(chan User, 1)
		wg.Add(1)

		result, err := UserDetailsBasedOnId("user1", ch, &wg)
		wg.Wait()
		close(ch)

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
		if result != nil {
			t.Errorf("Expected nil result, got %+v", result)
		}
	})

	t.Run("Non200Status", func(t *testing.T) {
		cleanup := setupErrorServer(t, "/user/user1", http.StatusNotFound)
		defer cleanup()

		var wg sync.WaitGroup
		ch := make(chan User, 1)
		wg.Add(1)

		result, err := UserDetailsBasedOnId("user1", ch, &wg)
		wg.Wait()
		close(ch)

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
		if result != nil {
			t.Errorf("Expected nil result, got %+v", result)
		}
	})
}

// ============================================================================
// Tests for GetUserDetails
// ============================================================================

func TestGetUserDetails(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		responses := map[string]User{
			"user1": createTestUser("user1", "Alice", "dept1", "team1", "role1", "Team A", "Dept A"),
			"user2": createTestUser("user2", "Bob", "dept2", "team2", "role2", "Team B", "Dept B"),
		}
		cleanup := setupMockServer(t, responses, nil)
		defer cleanup()

		inputUsers := []User{
			{UserId: "user1"},
			{UserId: "user2"},
		}

		result := GetUserDetails(inputUsers)

		if len(result) != 2 {
			t.Fatalf("Expected 2 users, got %d", len(result))
		}
		userMap := make(map[string]User)
		for _, u := range result {
			userMap[u.UserId] = u
		}
		if _, ok := userMap["user1"]; !ok {
			t.Error("Missing user1")
		}
		if _, ok := userMap["user2"]; !ok {
			t.Error("Missing user2")
		}
	})

	t.Run("EmptyInput", func(t *testing.T) {
		result := GetUserDetails([]User{})

		if result == nil {
			t.Fatal("Expected non-nil result")
		}
		if len(result) != 0 {
			t.Errorf("Expected empty result, got %d users", len(result))
		}
	})
}

// ============================================================================
// Tests for GetAllUsers
// ============================================================================

func TestGetAllUsers(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		allUsers := []User{
			createTestUser("1", "Alice", "dept1", "team1", "role1", "Team A", "Dept A"),
			createTestUser("2", "Bob", "dept2", "team2", "role2", "Team B", "Dept B"),
		}
		cleanup := setupMockServer(t, nil, allUsers)
		defer cleanup()

		users, err := GetAllUsers()

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(users) != 2 {
			t.Fatalf("Expected 2 users, got %d", len(users))
		}
		if users[0].UserId != "1" || users[1].UserId != "2" {
			t.Errorf("Unexpected users: %+v", users)
		}
	})

	t.Run("ServerError", func(t *testing.T) {
		cleanup := setupErrorServer(t, "/user/all", http.StatusInternalServerError)
		defer cleanup()

		_, err := GetAllUsers()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("ConnectionError", func(t *testing.T) {
		cleanup := setupInvalidServer(t)
		defer cleanup()

		_, err := GetAllUsers()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("DecodeError", func(t *testing.T) {
		cleanup := setupInvalidJSONServer(t, "/user/all")
		defer cleanup()

		_, err := GetAllUsers()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})
}

// ============================================================================
// Tests for GetAssignees
// ============================================================================

func TestGetAssignees(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		assignees := []User{
			createTestUser("1", "Alice", "dept1", "team1", "role1", "Team A", "Dept A"),
			createTestUser("2", "Bob", "dept2", "team2", "role2", "Team B", "Dept B"),
		}

		cleanup := setupCustomServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/user/assignees" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(assignees)
			} else {
				w.WriteHeader(http.StatusNotFound)
			}
		}))
		defer cleanup()

		result, err := GetAssignees("role1", "team1", "dept1")

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(result) != 2 {
			t.Fatalf("Expected 2 assignees, got %d", len(result))
		}
	})

	t.Run("ServerError", func(t *testing.T) {
		cleanup := setupErrorServer(t, "/user/assignees", http.StatusInternalServerError)
		defer cleanup()

		_, err := GetAssignees("role1", "team1", "dept1")

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("ConnectionError", func(t *testing.T) {
		cleanup := setupInvalidServer(t)
		defer cleanup()

		_, err := GetAssignees("role1", "team1", "dept1")

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("DecodeError", func(t *testing.T) {
		cleanup := setupInvalidJSONServer(t, "/user/assignees")
		defer cleanup()

		_, err := GetAssignees("role1", "team1", "dept1")

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})
}

// ============================================================================
// Tests for GetTeams
// ============================================================================

func TestGetTeams(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		teams := []Team{
			{ID: "team1", Name: "Team A", DepartmentID: "dept1"},
			{ID: "team2", Name: "Team B", DepartmentID: "dept2"},
		}

		cleanup := setupCustomServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/user/teams" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(teams)
			} else {
				w.WriteHeader(http.StatusNotFound)
			}
		}))
		defer cleanup()

		result, err := GetTeams()

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(result) != 2 {
			t.Fatalf("Expected 2 teams, got %d", len(result))
		}
	})

	t.Run("ServerError", func(t *testing.T) {
		cleanup := setupErrorServer(t, "/user/teams", http.StatusInternalServerError)
		defer cleanup()

		_, err := GetTeams()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("ConnectionError", func(t *testing.T) {
		cleanup := setupInvalidServer(t)
		defer cleanup()

		_, err := GetTeams()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("DecodeError", func(t *testing.T) {
		cleanup := setupInvalidJSONServer(t, "/user/teams")
		defer cleanup()

		_, err := GetTeams()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})
}

// ============================================================================
// Tests for GetDepartments
// ============================================================================

func TestGetDepartments(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		departments := []Department{
			{ID: "dept1", Name: "Dept A"},
			{ID: "dept2", Name: "Dept B"},
		}

		cleanup := setupCustomServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/user/departments" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(departments)
			} else {
				w.WriteHeader(http.StatusNotFound)
			}
		}))
		defer cleanup()

		result, err := GetDepartments()

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(result) != 2 {
			t.Fatalf("Expected 2 departments, got %d", len(result))
		}
	})

	t.Run("ServerError", func(t *testing.T) {
		cleanup := setupErrorServer(t, "/user/departments", http.StatusInternalServerError)
		defer cleanup()

		_, err := GetDepartments()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("ConnectionError", func(t *testing.T) {
		cleanup := setupInvalidServer(t)
		defer cleanup()

		_, err := GetDepartments()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})

	t.Run("DecodeError", func(t *testing.T) {
		cleanup := setupInvalidJSONServer(t, "/user/departments")
		defer cleanup()

		_, err := GetDepartments()

		if err == nil {
			t.Fatal("Expected error, got nil")
		}
	})
}
