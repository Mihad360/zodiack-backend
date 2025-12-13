class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string, stack = "") {
    // Ensure message is a string
    if (typeof message !== "string") {
      message = String(message); // Convert non-string to string
    }

    // Remove the "Error: " prefix if it exists
    if (message.startsWith("Error: ")) {
      message = message.slice(7); // Remove the first 7 characters ("Error: ")
    }

    super(message);
    this.statusCode = statusCode;

    // If a custom stack trace is passed, use it; otherwise, capture the default stack trace
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
