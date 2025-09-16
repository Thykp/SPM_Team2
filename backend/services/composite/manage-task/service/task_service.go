package task_service

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Task struct {
	TaskId            string    `json:"id"`
	TaskCreatedAt     string    `json:"created_at"`
	TaskTitle         string    `json:"title"`
	TaskDeadline      string    `json:"deadline"`
	TaskDescription   string    `json:"description"`
	TaskStatus        string    `json:"status"`
	TaskCollaborators *[]string `json:"collaborators"`
	TaskOwner         string    `json:"owner"`
	TaskParent        string    `json:"parent"`
}

const taskServiceAddress = "http://task"
const taskServicePort = 3031

func GetTaskBasedOnUser(userId string) ([]Task, error) {
	inputURL := fmt.Sprintf("%s:%d/task/%s", taskServiceAddress, taskServicePort, userId)
	resp, err := http.Get(inputURL)

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		taskItem := []Task{}

		decoder := json.NewDecoder(resp.Body)
		err := decoder.Decode(&taskItem)

		if err != nil {
			return nil, err
		}

		return taskItem, nil
	}
	return nil, err
}
