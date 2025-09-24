package profile_service

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type User struct {
	UserId         string  `json:"id"`
	UserDepartment string  `json:"department"`
	UserRole       string  `json:"role"`
	UserName       *string `json:"display_name"`
}

const userServiceAddress = "http://profile"
const userServicePort = 3030

func UserDetailsBasedOnId(userId string) ([]User, error) {
	inputURL := fmt.Sprintf("%s:%d/user/%s", userServiceAddress, userServicePort, userId)
	resp, err := http.Get(inputURL)

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		profileDetails := []User{}
		decoder := json.NewDecoder(resp.Body)
		err := decoder.Decode(&profileDetails)

		if err != nil {
			return nil, err
		}

		return []User{profileDetails[0]}, nil
	}
	return nil, err
}
