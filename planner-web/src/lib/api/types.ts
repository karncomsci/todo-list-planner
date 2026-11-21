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

// Category

/** Groups Tasks; names are unique per Owner (D24). */
export type Category = {
  id: number;
  name: string;
};

export type CreateCategoryRequest = {
  name: string;
};

/** Renaming takes the same body and rules as create. */
export type RenameCategoryRequest = CreateCategoryRequest;

export type CategoryResponse = {
  category: Category;
};

export type CategoryListResponse = {
  /** Sorted by name, ignoring letter case. */
  categories: Category[];
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
  /** null when the Task has no Category. */
  category: Category | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * The body of create and update. Only name and dueDate are required; "", null or
 * absent means none for the optional fields. Update replaces every field, so it
 * sends them all.
 */
export type TaskRequest = {
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
  /** One of the Owner's Categories, or null for none. */
  categoryId?: number | null;
};

export type TaskResponse = {
  task: Task;
};

export type TaskListResponse = {
  tasks: Task[];
};

// Overview

/** The current state only, all calculated by the API (D30, D32). */
export type OverviewResponse = {
  /** Today in Thailand, as the API counts it. */
  today: IsoDate;
  /** Every Task whose span covers today, done ones included, in Calendar order. */
  todayTasks: Task[];
  /** Every Overdue Task, however old, oldest due date first (D23). */
  overdueTasks: Task[];
  month: MonthSummary;
};

/** Counts over the Tasks due in the current month in Thailand (D30, story 38). */
export type MonthSummary = {
  /** "YYYY-MM", CE. */
  month: string;
  total: number;
  /** Progress 100. */
  done: number;
  /** Progress 1 to 99. */
  inProgress: number;
  /** Overdue now (D23). */
  overdue: number;
  /** The same Tasks per Status; all three present, adding up to total. */
  byStatus: Record<TaskStatus, number>;
  /** The same Tasks per Category, largest first; uncategorised last, as category null. */
  byCategory: CategoryCount[];
};

export type CategoryCount = {
  /** null for the Tasks that have no Category. */
  category: Category | null;
  count: number;
};

// Routine

/** One hour of the Routine, 5 to 23; text is "" for an empty hour (D26). */
export type RoutineEntry = {
  hour: number;
  text: string;
};

/** Every answer carries all nineteen hours, in order. */
export type RoutineResponse = {
  entries: RoutineEntry[];
};

/** Replaces the whole template; hours left out become empty. */
export type RoutineRequest = {
  entries: RoutineEntry[];
};

// Daily Checklist

/** One day's Daily Checklist (D27). A day with no record comes back empty. */
export type Checklist = {
  date: IsoDate;
  /** 0 to 30 */
  glasses: number;
  breakfastMenu: string;
  breakfastDone: boolean;
  lunchMenu: string;
  lunchDone: boolean;
  dinnerMenu: string;
  dinnerDone: boolean;
  /** The Reminder Note. */
  note: string;
};

export type ChecklistRequest = Omit<Checklist, "date">;

export type ChecklistResponse = {
  checklist: Checklist;
};

// Settings

export type Settings = {
  /** Glasses per day, 1 to 30; 8 until changed (D28, A4). */
  waterGoal: number;
};

export type SettingsResponse = {
  settings: Settings;
};

/** Saves every setting. */
export type SettingsRequest = Settings;

// Reports

/** Tasks completed in one Monday-start week. */
export type WeekCount = {
  /** The week's Monday. */
  weekStart: IsoDate;
  count: number;
};

/** The six Reports metrics for a range (D31), all calculated by the API (D32). */
export type Report = {
  from: IsoDate;
  to: IsoDate;
  /** Tasks due in the range. */
  total: number;
  completedPerWeek: WeekCount[];
  onTime: {
    onTime: number;
    late: number;
    notDone: number;
    /** 0 to 1; null when no Task due in the range is settled yet. */
    share: number | null;
  };
  byCategory: CategoryCount[];
  byPriority: Record<Priority, number>;
  overdue: number;
  water: {
    /** null when the whole range is after today. */
    averageGlasses: number | null;
    days: number;
  };
  allMealsDays: number;
};

export type ReportResponse = {
  report: Report;
};

// Password

export type ChangePasswordRequest = {
  currentPassword: string;
  /** At least 8 characters, at most 72 bytes. */
  newPassword: string;
};

// Backup

/** A backup file, as export answers it and import takes it (D33). */
export type Backup = {
  format: "planner-backup";
  version: 1;
  exportedAt: string;
  categories: Category[];
  tasks: (TaskRequest & { completedAt: string | null; createdAt: string; updatedAt: string })[];
  /** Only the hours with text. */
  routine: RoutineEntry[];
  checklists: Checklist[];
  settings: Settings;
};

/** What an import replaced the Owner's data with (D34). */
export type ImportBackupResponse = {
  imported: {
    categories: number;
    tasks: number;
    routine: number;
    checklists: number;
  };
};
