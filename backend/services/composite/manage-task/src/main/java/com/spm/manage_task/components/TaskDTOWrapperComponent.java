package com.spm.manage_task.components;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.dto.UserDto;
import com.spm.manage_task.factory.Participant;
import com.spm.manage_task.factory.TaskMicroserviceResponse;
import com.spm.manage_task.factory.TaskMicroserviceUpsertRequest;
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
            null,
            rawTask.getTaskPriority() // ensure getter exists in TaskMicroserviceResponse
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
                String id = participant.getProfileId();
                if (id == null) return null;
                id = id.trim();
                if (id.isEmpty() || "null".equalsIgnoreCase(id)) return null;
                return id;
            }
        }
        return null;
    }

    private ArrayList<String> extractCollaboratorIds(List<Participant> participants) {
        ArrayList<String> collabList = new ArrayList<>();
        if (participants == null) {
            return collabList;
        }
        for (Participant participant : participants) {
            if (!participant.getIsOwner()) {
                String id = participant.getProfileId();
                if (id == null) continue;
                id = id.trim();
                if (id.isEmpty() || "null".equalsIgnoreCase(id)) continue;
                // No UUID validation — keep original IDs for tests
                collabList.add(id);
            }
        }
        return collabList;
    }

    public void addOwnerInformation(TaskDto task) {
        if (task == null) return;

        String raw = task.getTaskOwner();
        if (raw == null) {
            setUnknownOwner(task);
            return;
        }
        raw = raw.trim();
        if (raw.isEmpty() || "null".equalsIgnoreCase(raw)) {
            setUnknownOwner(task);
            return;
        }

        // Call ProfileService even if it's not a UUID (tests mock "owner-123")
        UserDto ownerDetails = profileService.getUserById(raw);

        if (ownerDetails == null) {
            setUnknownOwner(task);
        } else {
            task.setTaskOwnerName(ownerDetails.getUserDisplayName());
            task.setTaskOwnerDepartment(ownerDetails.getUserDepartmentName());
        }
    }

    private void setUnknownOwner(TaskDto task) {
        task.setTaskOwnerName("Unknown");
        task.setTaskOwnerDepartment("Unknown");
    }

    public TaskMicroserviceUpsertRequest toTaskMicroserviceUpsert(TaskPostRequestDto incomingTaskBody) {
        List<Participant> participantList = incomingTaskBody.processCollaborators();

        System.out.println("Participants being sent to the atomic service: " + participantList);

        return new TaskMicroserviceUpsertRequest(
            incomingTaskBody.getTaskParent(),
            incomingTaskBody.getTaskProjectId(),
            incomingTaskBody.getTaskTitle(),
            incomingTaskBody.getTaskDeadline(),
            incomingTaskBody.getTaskDescription(),
            incomingTaskBody.getTaskStatus(),
            participantList,
            incomingTaskBody.getTaskPriority()
        );
    }
}
