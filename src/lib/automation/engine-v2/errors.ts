export class WorkflowEngineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "WorkflowEngineError";
    this.code = code;
  }
}

export function toWorkflowEngineError(error: unknown): WorkflowEngineError {
  if (error instanceof WorkflowEngineError) {
    return error;
  }

  if (error instanceof Error) {
    return new WorkflowEngineError("ENGINE_ERROR", error.message);
  }

  return new WorkflowEngineError("ENGINE_ERROR", "Workflow execution failed.");
}
