const { supabase } = require("../db/supabase");
const { DatabaseError, ValidationError } = require("./TaskError");

class Recurrence {
  static recurrenceTable = "revamped_recurrence";

  constructor(data) {
    this.id = data.id || null;
    this.task_id = data.task_id || null;
    this.frequency = data.frequency || null; // Enum: Day, Week, Month
    this.interval = data.interval || null; // Integer
    this.next_occurrence = data.next_occurrence || null; // Timestamptz
    this.end_date = data.end_date || null; // Timestamptz
    this.created_at = data.created_at || null; // Timestamptz
    this.updated_at = data.updated_at || null; // Timestamptz
  }

  async validate(isUpdate = false) {
    const errors = [];

    if (!isUpdate && !this.task_id) {
      errors.push("Task ID is required.");
    }

    if (!this.frequency || !["Day", "Week", "Month"].includes(this.frequency)) {
      errors.push("Frequency must be one of: Day, Week, Month.");
    }

  if (typeof this.interval !== "number" || this.interval <= 0) {
    errors.push("Interval must be a positive integer.");
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return true;
}

  static async getById(id) {
    const { data, error } = await supabase
      .from(Recurrence.recurrenceTable)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error in getById:", error);
      throw new DatabaseError("Failed to retrieve recurrence by ID", error);
    }

    return new Recurrence(data);
  }

  static async getByTaskId(task_id) {
    const { data, error } = await supabase
      .from(Recurrence.recurrenceTable)
      .select("*")
      .eq("task_id", task_id);

    if (error) {
      console.error("Error in getByTaskId:", error);
      throw new DatabaseError("Failed to retrieve recurrence by task ID", error);
    }

    return data.map((recurrence) => new Recurrence(recurrence));
  }

  async create() {
    await this.validate();

    const { data, error } = await supabase
      .from(Recurrence.recurrenceTable)
      .insert({
        task_id: this.task_id,
        frequency: this.frequency,
        interval: this.interval,
        end_date: this.end_date,
      })
      .select()
      .single();

    if (error) {
      console.error("Error in create:", error);
      throw new DatabaseError("Failed to create recurrence", error);
    }

    this.id = data.id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    return this;
  }

  async update() {
    await this.validate(true);
  
    console.log("Freq: " + this.frequency);
    console.log("Interval: " + this.interval);
    console.log("End Date: " + this.end_date);

    const { error } = await supabase
      .from(Recurrence.recurrenceTable)
      .update({
        frequency: this.frequency,
        interval: this.interval,
        end_date: this.end_date,
      })
      .eq("id", this.id);
  
    if (error) {
      console.error("Error in update:", error);
      throw new DatabaseError("Failed to update recurrence", error);
    }
  
    return this;
  }

  async delete() {
    const { error } = await supabase
      .from(Recurrence.recurrenceTable)
      .delete()
      .eq("id", this.id);

    if (error) {
      console.error("Error in delete:", error);
      throw new DatabaseError("Failed to delete recurrence", error);
    }
  }
}

module.exports = Recurrence;