// Validation utilities for Tasks

// Title: required, non-empty
export function validateTitle(value: string): string | undefined {
  if (!value || !value.trim()) return "Please fill in the title";
  return undefined;
}

// Description: required, non-empty
export function validateDescription(value: string): string | undefined {
  if (!value || !value.trim()) return "Please fill in the description";
  return undefined;
}

// Deadline: valid datetime-local string, required, not in past
export function validateDeadlineLocalString(value: string): string | undefined {
  if (!value) return "Please enter a valid deadline.";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Please enter a valid deadline.";
  const now = new Date();
  // Use the same "local time" as input's min
  if (d.getTime() < now.getTime()) return "Deadline cannot be in the past";
  return undefined;
}

// Priority: integer 1-10 inclusive
export function validatePriority(value: number): string | undefined {
  if (!Number.isInteger(value) || value < 1 || value > 10)
    return "Priority must be between 1 and 10";
  return undefined;
}

// Returns the local min string for use in <input type="datetime-local" min=...>
export function getNowLocalInputMin() {
  return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

// Returns a safe formatting for datetime-local input. Returns empty string on invalid date.
export function safeFormatToLocalInput(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
