package profile_service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type User struct {
	UserId         string  `json:"id"`
	UserDepartment *string `json:"department"`
	UserRole       *string `json:"role"`
	UserName       *string `json:"display_name"`
}

const userServiceAddress = "http://profile"
const userServicePort = 3030

func UserDetailsBasedOnId(userId string, ch chan<- []User, wg *sync.WaitGroup) ([]User, error) {
	defer wg.Done()

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

		res := []User{profileDetails[0]}

		ch <- res

		return res, nil
	}
	return nil, err
}

func GetUserDetails(userIdList []User) []User {
	ch := make(chan []User, len(userIdList))
	var wg sync.WaitGroup

	for _, userInfo := range userIdList {
		wg.Add(1)
		userId := userInfo.UserId

		go UserDetailsBasedOnId(userId, ch, &wg)
	}
	wg.Wait()
	close(ch)

	resBody := []User{}

	for res := range ch {
		resBody = append(resBody, res...)
	}

	return resBody

}
