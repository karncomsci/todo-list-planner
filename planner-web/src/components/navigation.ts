import {
  CalendarDays,
  ChartColumn,
  Clock,
  LayoutDashboard,
  type LucideIcon,
  PlusCircle,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  /** Thai name from the glossary. */
  label: string;
  icon: LucideIcon;
  /** False until the stage that builds the page. */
  ready: boolean;
};

const overview: NavItem = { href: "/overview", label: "ภาพรวม", icon: LayoutDashboard, ready: true };
const calendar: NavItem = { href: "/calendar", label: "ตารางงาน", icon: CalendarDays, ready: true };
const taskEntry: NavItem = { href: "/tasks", label: "บันทึกงาน", icon: PlusCircle, ready: true };
const lifeSchedule: NavItem = { href: "/life", label: "ตารางชีวิต", icon: Clock, ready: true };
const reports: NavItem = { href: "/reports", label: "รายงาน", icon: ChartColumn, ready: false };
const settings: NavItem = { href: "/settings", label: "ตั้งค่า", icon: Settings, ready: false };

/** Left menu on computers: all six pages (D10). */
export const sideNav = [overview, calendar, taskEntry, lifeSchedule, reports, settings];

/** Bottom menu on phones: four pages, then More (D10). */
export const bottomNav = [overview, calendar, { ...taskEntry, label: "เพิ่มงาน" }, lifeSchedule];

/** Pages behind the phone's More button (D10). */
export const moreNav = [reports, settings];
