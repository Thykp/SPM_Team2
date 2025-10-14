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

// Create a mock HTTP server that mimics your profile service
func createMockProfileServer(responses map[string]User, allUsers []User) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/user/all" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(allUsers)
			return
		}
		// Extract user ID from path /user/{id}
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

// Test helper to create sample users
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

// Since your service has hardcoded URLs, we need to temporarily modify them for testing
// This is a limitation - in production code, you'd want dependency injection
func TestGetAllUsers_Success(t *testing.T) {
	// Setup mock data
	allUsers := []User{
		createTestUser("1", "Alice", "dept1", "team1", "role1", "Team A", "Dept A"),
		createTestUser("2", "Bob", "dept2", "team2", "role2", "Team B", "Dept B"),
	}

	// Create mock server
	server := createMockProfileServer(nil, allUsers)
	defer server.Close()

	// Parse server URL
	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	// Save original values
	origAddr := userServiceAddress
	origPort := userServicePort
	defer func() {
		userServiceAddress = origAddr
		userServicePort = origPort
	}()

	// Set to mock server
	userServiceAddress = "http://" + host
	userServicePort = port

	// Call the function
	users, err := GetAllUsers()

	// Assertions
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(users) != 2 {
		t.Fatalf("Expected 2 users, got %d", len(users))
	}
	if users[0].UserId != "1" || users[1].UserId != "2" {
		t.Errorf("Unexpected users: %+v", users)
	}
}

func TestGetAllUsers_ServerError(t *testing.T) {
	// Create mock server that returns error
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/user/all" {
			w.WriteHeader(http.StatusInternalServerError)
		}
	}))
	defer server.Close()

	// Parse server URL
	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	// Save original values
	origAddr := userServiceAddress
	origPort := userServicePort
	defer func() {
		userServiceAddress = origAddr
		userServicePort = origPort
	}()

	// Set to mock server
	userServiceAddress = "http://" + host
	userServicePort = port

	// Call the function
	_, err := GetAllUsers()

	// Assertions
	if err == nil {
		t.Fatal("Expected error, got nil")
	}
}

func TestGetUserDetails_Success(t *testing.T) {
	// Setup mock data
	responses := map[string]User{
		"user1": createTestUser("user1", "Alice", "dept1", "team1", "role1", "Team A", "Dept A"),
		"user2": createTestUser("user2", "Bob", "dept2", "team2", "role2", "Team B", "Dept B"),
	}

	// Create mock server
	server := createMockProfileServer(responses, nil)
	defer server.Close()

	// Parse server URL
	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	// Save original values
	origAddr := userServiceAddress
	origPort := userServicePort
	defer func() {
		userServiceAddress = origAddr
		userServicePort = origPort
	}()

	// Set to mock server
	userServiceAddress = "http://" + host
	userServicePort = port

	// Input
	inputUsers := []User{
		{UserId: "user1"},
		{UserId: "user2"},
	}

	// Call the function
	result := GetUserDetails(inputUsers)

	// Assertions
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
}

func TestGetUserDetails_EmptyInput(t *testing.T) {
	// Input
	inputUsers := []User{}

	// Call the function
	result := GetUserDetails(inputUsers)

	// Assertions
	if result == nil {
		t.Fatal("Expected non-nil result")
	}
	if len(result) != 0 {
		t.Errorf("Expected empty result, got %d users", len(result))
	}
}

func TestUserDetailsBasedOnId_Success(t *testing.T) {
	// Setup mock data
	responses := map[string]User{
		"user1": createTestUser("user1", "Alice", "dept1", "team1", "role1", "Team A", "Dept A"),
	}

	// Create mock server
	server := createMockProfileServer(responses, nil)
	defer server.Close()

	// Parse server URL
	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	// Save original values
	origAddr := userServiceAddress
	origPort := userServicePort
	defer func() {
		userServiceAddress = origAddr
		userServicePort = origPort
	}()

	// Set to mock server
	userServiceAddress = "http://" + host
	userServicePort = port

	// Setup
	var wg sync.WaitGroup
	ch := make(chan User, 1)
	wg.Add(1)

	// Call the function
	result, err := UserDetailsBasedOnId("user1", ch, &wg)

	// Wait
	wg.Wait()
	close(ch)

	// Assertions
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if result == nil {
		t.Fatal("Expected non-nil result")
	}
	if result.UserId != "user1" {
		t.Errorf("Unexpected user: %+v", result)
	}

	// Check channel
	select {
	case user := <-ch:
		if user.UserId != "user1" {
			t.Errorf("Channel user mismatch: %+v", user)
		}
	default:
		t.Error("Expected user in channel")
	}
}

func TestUserDetailsBasedOnId_NotFound(t *testing.T) {
	// Create mock server
	server := createMockProfileServer(map[string]User{}, nil)
	defer server.Close()

	// Parse server URL
	u, _ := url.Parse(server.URL)
	host, portStr, _ := net.SplitHostPort(u.Host)
	port, _ := strconv.Atoi(portStr)

	// Save original values
	origAddr := userServiceAddress
	origPort := userServicePort
	defer func() {
		userServiceAddress = origAddr
		userServicePort = origPort
	}()

	// Set to mock server
	userServiceAddress = "http://" + host
	userServicePort = port

	// Setup
	var wg sync.WaitGroup
	ch := make(chan User, 1)
	wg.Add(1)

	// Call the function
	result, err := UserDetailsBasedOnId("nonexistent", ch, &wg)

	// Wait
	wg.Wait()
	close(ch)

	// Assertions
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if result == nil {
		t.Fatal("Expected non-nil result")
	}
	if result.UserId != "" {
		t.Errorf("Expected empty user, got %+v", result)
	}

	// Check channel has the user
	select {
	case user := <-ch:
		if user.UserId != "" {
			t.Errorf("Expected empty user in channel, got %+v", user)
		}
	default:
		t.Error("Expected user in channel")
	}
}
