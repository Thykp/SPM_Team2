// Custom error classes for Task service

class TaskNotFoundError extends Error {
    constructor(message = "Task not found") {
        super(message);
        this.name = "TaskNotFoundError";
        this.statusCode = 404;
    }
}

class ValidationError extends Error {
    constructor(errors = []) {
        const message = Array.isArray(errors) ? errors.join(", ") : errors;
        super(message);
        this.name = "ValidationError";
        this.statusCode = 400;
        this.errors = Array.isArray(errors) ? errors : [errors];
    }
}

class DatabaseError extends Error {
    constructor(message = "Database operation failed", originalError = null) {
        super(message);
        this.name = "DatabaseError";
        this.statusCode = 500;
        this.originalError = originalError;
    }
}

module.exports = {
    TaskNotFoundError,
    ValidationError,
    DatabaseError
};
