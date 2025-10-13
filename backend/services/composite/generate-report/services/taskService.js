
const TASKS = [
  // --- Tasks owned by user D111 (your testing user) ---
  {
    id: "t1",
    title: "Setup React Frontend",
    status: "Projected",
    deadline: "2025-10-20T10:00:00+00:00",
    description: "Initialize React with Vite and TailwindCSS",
    priority: 5,
    project_id: "p101",
    created_at: "2025-10-01T09:00:00+00:00",
    updated_at: "2025-10-10T09:00:00+00:00",
    participants: [
      { is_owner: true, profile_id: "d1111111-1111-1111-1111-111111111111" },
      { is_owner: false, profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" }
    ]
  },
  {
    id: "t2",
    title: "Implement Task API",
    status: "In Progress",
    deadline: "2025-10-15T00:00:00+00:00",
    description: "Develop REST endpoints for task CRUD",
    priority: 9,
    project_id: "p101",
    created_at: "2025-10-02T10:00:00+00:00",
    updated_at: "2025-10-12T10:00:00+00:00",
    participants: [
      { is_owner: true, profile_id: "d1111111-1111-1111-1111-111111111111" },
      { is_owner: false, profile_id: "c0cd847d-8c61-45dd-8dda-ecffe214943e" }
    ]
  },
  {
    id: "t3",
    title: "Database Schema Migration",
    status: "Under Review",
    deadline: "2025-10-18T00:00:00+00:00",
    description: "Add task_participant relation and run Supabase migration",
    priority: 7,
    project_id: "p102",
    created_at: "2025-10-03T12:00:00+00:00",
    updated_at: "2025-10-12T14:00:00+00:00",
    participants: [
      { is_owner: true, profile_id: "d1111111-1111-1111-1111-111111111111" },
      { is_owner: false, profile_id: "2787f4d7-db48-41d4-a055-eb9376bfd443" }
    ]
  },
  {
    id: "t4",
    title: "Bug Fix - Deadline Not Updating",
    status: "Completed",
    deadline: "2025-10-05T00:00:00+00:00",
    description: "Fix deadline patch logic in backend service",
    priority: 6,
    project_id: "p102",
    created_at: "2025-09-28T12:00:00+00:00",
    updated_at: "2025-10-06T10:00:00+00:00",
    participants: [
      { is_owner: true, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t5",
    title: "Write Unit Tests",
    status: "Ongoing",
    deadline: "2025-10-25T00:00:00+00:00",
    description: "Add Jest tests for TaskController and validation logic",
    priority: 4,
    project_id: "p103",
    created_at: "2025-10-09T11:00:00+00:00",
    updated_at: "2025-10-11T11:00:00+00:00",
    participants: [
      { is_owner: true, profile_id: "d1111111-1111-1111-1111-111111111111" },
      { is_owner: false, profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" }
    ]
  },

  // --- Tasks where D111 is collaborator ---
  {
    id: "t6",
    title: "Frontend Integration Test",
    status: "Under Review",
    deadline: "2025-10-16T00:00:00+00:00",
    description: "Integration between frontend and backend endpoints",
    priority: 8,
    project_id: "p101",
    created_at: "2025-10-08T09:00:00+00:00",
    updated_at: "2025-10-10T09:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t7",
    title: "Project Retrospective",
    status: "Completed",
    deadline: "2025-10-10T00:00:00+00:00",
    description: "Review last sprint deliverables",
    priority: 5,
    project_id: "p104",
    created_at: "2025-09-30T09:00:00+00:00",
    updated_at: "2025-10-10T09:00:00+00:00",
    participants: [
      { is_owner: true, profile_id: "2787f4d7-db48-41d4-a055-eb9376bfd443" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t8",
    title: "Prepare User Guide",
    status: "Under Review",
    deadline: "2025-10-19T00:00:00+00:00",
    description: "Write guide for the new release",
    priority: 3,
    project_id: "p105",
    created_at: "2025-10-05T12:00:00+00:00",
    updated_at: "2025-10-12T12:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },

  // --- Tasks owned by other users (not D111) ---
  {
    id: "t9",
    title: "Fix Notifications",
    status: "Ongoing",
    deadline: "2025-10-22T00:00:00+00:00",
    description: "Repair email and in-app notification triggers",
    priority: 8,
    project_id: "p104",
    created_at: "2025-10-09T09:00:00+00:00",
    updated_at: "2025-10-11T09:00:00+00:00",
    participants: [
      { is_owner: true, profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" }
    ]
  },
  {
    id: "t10",
    title: "Deploy to Production",
    status: "Projected",
    deadline: "2025-10-27T00:00:00+00:00",
    description: "Final deploy to prod environment",
    priority: 10,
    project_id: "p105",
    created_at: "2025-10-12T09:00:00+00:00",
    updated_at: "2025-10-12T09:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t11",
    title: "Code Review Session",
    status: "In Progress",
    deadline: "2025-10-14T00:00:00+00:00",
    description: "Peer code review before merging main branch",
    priority: 6,
    project_id: "p105",
    created_at: "2025-10-08T09:00:00+00:00",
    updated_at: "2025-10-10T09:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "2787f4d7-db48-41d4-a055-eb9376bfd443" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t12",
    title: "Backend Refactor",
    status: "Under Review",
    deadline: "2025-10-18T00:00:00+00:00",
    description: "Refactor old controllers to service pattern",
    priority: 7,
    project_id: "p106",
    created_at: "2025-10-03T09:00:00+00:00",
    updated_at: "2025-10-12T09:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "2787f4d7-db48-41d4-a055-eb9376bfd443" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t13",
    title: "Sprint Planning",
    status: "Completed",
    deadline: "2025-10-01T00:00:00+00:00",
    description: "Organize backlog for next sprint",
    priority: 5,
    project_id: "p107",
    created_at: "2025-09-25T09:00:00+00:00",
    updated_at: "2025-10-01T09:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t14",
    title: "Email Templates Redesign",
    status: "Under Review",
    deadline: "2025-10-17T00:00:00+00:00",
    description: "Revamp system email templates using MJML",
    priority: 9,
    project_id: "p108",
    created_at: "2025-10-04T09:00:00+00:00",
    updated_at: "2025-10-12T09:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  },
  {
    id: "t15",
    title: "Audit Logging Feature",
    status: "Overdue",
    deadline: "2025-10-05T00:00:00+00:00",
    description: "Implement audit trail for key actions",
    priority: 10,
    project_id: "p109",
    created_at: "2025-09-28T09:00:00+00:00",
    updated_at: "2025-10-10T09:00:00+00:00",
    participants: [
      { is_owner: true,  profile_id: "b0d001db-a660-4503-bb53-9f6e6bd15942" },
      { is_owner: false, profile_id: "d1111111-1111-1111-1111-111111111111" }
    ]
  }
];


function roleForUser(task, userId) {
  const owners = task.participants.filter(p => p.is_owner).map(p => p.profile_id);
  const collabs = task.participants.filter(p => !p.is_owner).map(p => p.profile_id);
  const isOwner = owners.includes(userId);
  const isCollab = collabs.includes(userId);
  if (isOwner) return "Owner";
  if (isCollab) return "Collaborator";
}

async function fetchTasksForUser(userId) {
  const ownerTasks = [];
  const collaboratorTasks = [];

  for (const t of TASKS) {
    const role = roleForUser(t, userId);
    const normalized = {
      id: t.id,
      title: t.title,
      status: t.status,
      role,
      dueDate: t.deadline,
      priority: t.priority,
      projectId: t.project_id,
      updatedAt: t.updated_at
    };

    if (role == "Owner") ownerTasks.push(normalized);
    if (role == "Collaborator") collaboratorTasks.push(normalized);
  }

  return { ownerTasks, collaboratorTasks };
}



module.exports = {fetchTasksForUser};