function aggregate({ ownerTasks, collaboratorTasks }) {
  const byId = new Map();
  for (const t of ownerTasks) byId.set(t.id, { ...t, role: t.role || "Owner" });
  for (const t of collaboratorTasks) { if (!byId.has(t.id)) byId.set(t.id, { ...t, role: "Collaborator" });}

  const all = [...byId.values()];

  // ✅ New status set
  const statuses = ["Under Review", "Ongoing", "Completed", "Overdue", "Unassigned"];
  const kpis = Object.fromEntries(statuses.map(s => [s, 0]));
  for (const t of all) if (kpis.hasOwnProperty(t.status)) kpis[t.status]++;
  kpis.Total = all.length;

  const byRole = {
    "Owner": [],
    "Collaborator": [],
    "Owner & Collaborator": []
  };
  for (const t of all) if (byRole[t.role]) byRole[t.role].push(t);

  const sortFn = (a, b) =>
    (a.status || "").localeCompare(b.status || "") ||
    (a.dueDate || "").localeCompare(b.dueDate || "") ||
    (b.priority ?? -1) - (a.priority ?? -1);

  Object.values(byRole).forEach(arr => arr.sort(sortFn));

  return { all, byRole, kpis };
}

module.exports = { aggregate };
