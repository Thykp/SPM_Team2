package services

type ProjectBody struct {
	ProjectId            string   `json:"id"`
	ProjectTitle         string   `json:"title"`
	ProjectTaskList      []string `json:"task_list"`
	ProjectDescription   string   `json:"description"`
	ProjectOwner         string   `json:"owner"`
	ProjectCollaborators []string `json:"collaborators"`
}
