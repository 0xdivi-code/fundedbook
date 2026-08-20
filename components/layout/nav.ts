import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  Settings,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "Overview",
  },
  {
    href: "/trades",
    label: "Journal",
    icon: BookOpen,
    section: "Overview",
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    section: "Overview",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: ChartNoAxesCombined,
    section: "Analysis",
  },
  {
    href: "/playbook",
    label: "Playbook",
    icon: Target,
    section: "Analysis",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    section: "System",
  },
];

export const NAV_SECTIONS = ["Overview", "Analysis", "System"];

export const ICON_FALLBACK = BarChart3;
