package manage_account_test

import (
	"encoding/json"
	"testing"

	profile_service "manage-account/service"
)

func TestUserDetailsBasedOnId(t *testing.T) {
	// Test JSON unmarshaling used in UserDetailsBasedOnId function
	mockResponse := `[{"id":"123","department":"IT","role":"Developer","display_name":"John Doe"}]`

	var users []profile_service.User
	err := json.Unmarshal([]byte(mockResponse), &users)

	if err != nil {
		t.Error("Failed to unmarshal JSON:", err)
	}

	if len(users) != 1 {
		t.Error("Expected 1 user, got", len(users))
	}

	user := users[0]
	if user.UserId != "123" {
		t.Error("Expected UserId '123', got", user.UserId)
	}
}
