package profile_service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type User struct {
	UserId         string  `json:"id"`
	UserRole       *string `json:"role"`
	UserName       *string `json:"display_name"`
	UserTeamId	   *string `json:"team_id"`
	UserDepartmentId   *string `json:"department_id"`
	UserTeamName	   *string `json:"team_name"`
	UserDepartmentName   *string `json:"department_name"`
}

var userServiceAddress = "http://profile"
var userServicePort = 3030

func UserDetailsBasedOnId(userId string, ch chan<- User, wg *sync.WaitGroup) (*User, error) {
	defer wg.Done()

	inputURL := fmt.Sprintf("%s:%d/user/%s", userServiceAddress, userServicePort, userId)
	resp, err := http.Get(inputURL)

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var profileDetails User
		decoder := json.NewDecoder(resp.Body)
		err := decoder.Decode(&profileDetails)

		if err != nil {
			return nil, err
		}

		ch <- profileDetails

		return &profileDetails, nil
	}
	return nil, fmt.Errorf("failed to fetch user details for userId: %s", userId)
}

func GetUserDetails(userIdList []User) []User {
    ch := make(chan User, len(userIdList))
    var wg sync.WaitGroup

    for _, userInfo := range userIdList {
        wg.Add(1)
        userId := userInfo.UserId

        go func(id string) {
            _, _ = UserDetailsBasedOnId(id, ch, &wg)
        }(userId)
    }
    wg.Wait()
    close(ch)

    resBody := []User{}

    for user := range ch {
        resBody = append(resBody, user)
    }

    return resBody
}

func GetAllUsers() ([]User, error) {
    // Define the URL for the profile atomic service
    url := fmt.Sprintf("%s:%d/user/all", userServiceAddress, userServicePort)

    // Make the HTTP GET request
    resp, err := http.Get(url)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch users: %v", err)
    }
    defer resp.Body.Close()

    // Check for non-200 status codes
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("failed to fetch users: status code %d", resp.StatusCode)
    }

    // Decode the response body into a slice of User objects
    var users []User
    if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
        return nil, fmt.Errorf("failed to decode users: %v", err)
    }

    return users, nil
}
