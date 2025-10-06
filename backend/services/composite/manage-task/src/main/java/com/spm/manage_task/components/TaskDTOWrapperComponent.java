package com.spm.manage_task.components;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.factory.Participant;
import com.spm.manage_task.factory.TaskMicroserviceResponse;
import com.spm.manage_task.factory.TaskMicroserviceUpsertRequest;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.dto.UserDto;
import com.spm.manage_task.services.ProfileService;

@Component
public class TaskDTOWrapperComponent {
    
    @Autowired
    private ProfileService profileService;
    
    public TaskDto toTaskDto(TaskMicroserviceResponse rawTask) {
        if (rawTask == null) {
            return null;
        }

        String ownerId = extractOwnerId(rawTask.getTaskParticipants());
        ArrayList<String> collaboratorIds = extractCollaboratorIds(rawTask.getTaskParticipants());

        TaskDto incomingTask = new TaskDto(
            rawTask.getTaskId(),
            rawTask.getTaskTitle(),
            rawTask.getProjectId(),
            rawTask.getTaskDeadline(),
            rawTask.getTaskDescription(),
            rawTask.getTaskStatus(),
            collaboratorIds,
            ownerId,
            rawTask.getParentTaskId(),
            null,
            null
        );

        addOwnerInformation(incomingTask);
        
        return incomingTask;
    }
    

    public List<TaskDto> toTaskDtoList(TaskMicroserviceResponse[] rawTasks) {
        if (rawTasks == null || rawTasks.length == 0) {
            return new ArrayList<>();
        }
        
        List<TaskDto> taskDtos = new ArrayList<>();
        for (TaskMicroserviceResponse rawTask : rawTasks) {
            taskDtos.add(toTaskDto(rawTask));
        }
        return taskDtos;
    }
    

    private String extractOwnerId(List<Participant> participants) {
        if (participants == null) {
            return null;
        }
        
        for (Participant participant : participants) {
            if (participant.getIsOwner()) {
                return participant.getProfileId();
            }
        }
        return null;
    }
    

    private ArrayList<String> extractCollaboratorIds(List<Participant> participants) {
        if (participants == null) {
            return new ArrayList<>();
        }

        ArrayList<String> collabList = new ArrayList<>();

        for (Participant participant : participants){
            if (!participant.getIsOwner()){
                collabList.add(participant.getProfileId());
            }
        }

        return collabList;
    }


    public void addOwnerInformation(TaskDto task) {
        if (task == null) {
            return;
        }

        UserDto ownerDetails = profileService.getUserById(task.getTaskOwner());

        if (ownerDetails == null) {
            task.setTaskOwnerName("Unknown");
            task.setTaskOwnerDepartment("Unknown");
        } else {
            task.setTaskOwnerName(ownerDetails.getUserDisplayName());
            task.setTaskOwnerDepartment(ownerDetails.getUserDepartmentName());
        }
    }


    public TaskMicroserviceUpsertRequest toTaskMicroserviceUpsert (TaskPostRequestDto incomingTaskBody){
        List<Participant> participantList = incomingTaskBody.processCollaborators();
        TaskMicroserviceUpsertRequest upsertBody = new TaskMicroserviceUpsertRequest(
            incomingTaskBody.getTaskParent(),
            incomingTaskBody.getTaskProjectId(),
            incomingTaskBody.getTaskTitle(),
            incomingTaskBody.getTaskDeadline(),
            incomingTaskBody.getTaskDescription(),
            incomingTaskBody.getTaskStatus(),
            participantList
        );



        return upsertBody;
    }
}
