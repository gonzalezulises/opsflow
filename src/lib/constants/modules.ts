import {
  ClipboardCheck,
  FileText,
  GitBranch,
  ShieldAlert,
  DollarSign,
  ListOrdered,
  CalendarDays,
  BarChart3,
  FileBarChart,
  LayoutDashboard,
  Settings,
  Users,
  Library,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export interface ModuleDefinition {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  path: string;
  order: number;
}

export const CASE_MODULES: ModuleDefinition[] = [
  {
    id: "context",
    label: "Contexto del caso",
    shortLabel: "Caso",
    description: "Datos generales, sector, métricas base",
    icon: FileText,
    path: "context",
    order: 0,
  },
  {
    id: "diagnostic",
    label: "Diagnóstico de madurez",
    shortLabel: "Diagnóstico",
    description: "15 preguntas de madurez operativa",
    icon: ClipboardCheck,
    path: "diagnostic",
    order: 1,
  },
  {
    id: "vsm",
    label: "Mapa de flujo de valor (VSM)",
    shortLabel: "VSM",
    description: "Pasos del proceso, tiempos, eficiencia",
    icon: GitBranch,
    path: "vsm",
    order: 2,
  },
  {
    id: "risks",
    label: "Riesgo contextual",
    shortLabel: "Riesgos",
    description: "Matriz de riesgos por paso del proceso",
    icon: ShieldAlert,
    path: "risks",
    order: 3,
  },
  {
    id: "waste",
    label: "Costo del desperdicio",
    shortLabel: "Desperdicio",
    description: "Cuantificación de fugas económicas",
    icon: DollarSign,
    path: "waste",
    order: 4,
  },
  {
    id: "prioritization",
    label: "Priorización de iniciativas",
    shortLabel: "Priorización",
    description: "Matriz ponderada de iniciativas",
    icon: ListOrdered,
    path: "prioritization",
    order: 5,
  },
  {
    id: "plan",
    label: "Plan de 30 días",
    shortLabel: "Plan",
    description: "Acciones, responsables, metas",
    icon: CalendarDays,
    path: "plan",
    order: 6,
  },
  {
    id: "tracking",
    label: "Seguimiento semanal",
    shortLabel: "Seguimiento",
    description: "Métricas semanales y tendencias",
    icon: BarChart3,
    path: "tracking",
    order: 7,
  },
  {
    id: "report",
    label: "Reporte ejecutivo",
    shortLabel: "Reporte",
    description: "Resumen consolidado y exportación",
    icon: FileBarChart,
    path: "report",
    order: 8,
  },
];

export const NAV_ITEMS = [
  { label: "Metodología", icon: GraduationCap, path: "/dashboard/methodology" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Casos", icon: FileText, path: "/dashboard/cases" },
  { label: "Recursos", icon: Library, path: "/dashboard/resources" },
  { label: "Equipo", icon: Users, path: "/dashboard/team" },
  { label: "Configuración", icon: Settings, path: "/dashboard/settings" },
];
