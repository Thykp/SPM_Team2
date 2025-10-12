package com.spm.manage_task.components;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
                try {
                    UUID.fromString(id);
                    return id;
                } catch (IllegalArgumentException ex) {
                    return null;
                }
            }
        }
        return null;
    }

    private ArrayList<String> extractCollaboratorIds(List<Participant> participants) {
        if (participants == null) {
            return new ArrayList<>();
        }

        ArrayList<String> collabList = new ArrayList<>();

        for (Participant participant : participants) {
            if (!participant.getIsOwner()) {
                String id = participant.getProfileId();
                if (id == null) continue;
                id = id.trim();
                if (id.isEmpty() || "null".equalsIgnoreCase(id)) continue;
                try {
                    UUID.fromString(id);
                    collabList.add(id);
                } catch (IllegalArgumentException ignore) {
                }
            }
        }

        return collabList;
    }

    public void addOwnerInformation(TaskDto task) {
        if (task == null) {
            return;
        }

        String raw = task.getTaskOwner();

        // 1) Short-circuit on null/blank/"null"
        if (raw == null) {
            setUnknownOwner(task);
            return;
        }
        raw = raw.trim();
        if (raw.isEmpty() || "null".equalsIgnoreCase(raw)) {
            setUnknownOwner(task);
            return;
        }

        // 2) Validate UUID format (prevents /user/null or /user/garbage)
        try {
            UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            setUnknownOwner(task);
            return;
        }

        // 3) Safe call to Profile service
        UserDto ownerDetails = profileService.getUserById(raw);
        if (ownerDetails == null) {
            setUnknownOwner(task);
            return;
        }

        task.setTaskOwnerName(ownerDetails.getUserDisplayName());
        task.setTaskOwnerDepartment(ownerDetails.getUserDepartmentName());
    }

    private void setUnknownOwner(TaskDto task) {
        task.setTaskOwnerName("Unknown");
        task.setTaskOwnerDepartment("Unknown");
    }

    public TaskMicroserviceUpsertRequest toTaskMicroserviceUpsert(TaskPostRequestDto incomingTaskBody) {
        List<Participant> participantList = incomingTaskBody.processCollaborators();
        TaskMicroserviceUpsertRequest upsertBody = new TaskMicroserviceUpsertRequest(
            incomingTaskBody.getTaskParent(),
            incomingTaskBody.getTaskProjectId(),
            incomingTaskBody.getTaskTitle(),
            incomingTaskBody.getTaskDeadline(),
            incomingTaskBody.getTaskDescription(),
            incomingTaskBody.getTaskStatus(),
            participantList,
            incomingTaskBody.getTaskPriority()
        );
        return upsertBody;
    }
}
