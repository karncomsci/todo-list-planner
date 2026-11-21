import type { IsoDate } from "@/lib/dates";

// Every API data type, written by hand to mirror ../docs/api.md (D11).
// Change a shape here in the same ticket as docs/api.md and the Go handler.

/** The single error shape of every endpoint (D15). */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    /** Present only on validation errors: the request field that failed. */
    field?: string;
  };
};

export type Health = {
  status: "ok";
};

// Session

export type Owner = {
  id: number;
  email: string;
};

export type SignInRequest = {
  email: string;
  password: string;
  /** Stay signed in on this device for 30 days (A2). */
  remember: boolean;
};

export type SessionResponse = {
  owner: Owner;
};

// Task

export type Priority = "high" | "medium" | "low";

/** Derived by the API from Progress (D21). */
export type TaskStatus = "not_started" | "in_progress" | "done";

export type Task = {
  id: number;
  name: string;
  dueDate: IsoDate;
  startDate: IsoDate | null;
  /** "HH:MM" */
  startTime: string | null;
  /** "HH:MM" */
  endTime: string | null;
  priority: Priority;
  /** 0 to 100 */
  progress: number;
  status: TaskStatus;
  /** Computed by the API in Thailand time (D23). */
  isOverdue: boolean;
  note: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Only name and dueDate are required. "" or null means none for the optional fields. */
export type CreateTaskRequest = {
  name: string;
  dueDate: IsoDate | "";
  startDate?: IsoDate | "" | null;
  /** "HH:MM"; given together with endTime or not at all (A1). */
  startTime?: string | null;
  endTime?: string | null;
  /** Defaults to "medium". */
  priority?: Priority;
  /** 0 to 100, defaults to 0. */
  progress?: number;
  note?: string;
};

export type TaskResponse = {
  task: Task;
};

export type TaskListResponse = {
  tasks: Task[];
};
