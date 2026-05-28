/**
 * Ambient declarations for libraries whose bundled types don't always
 * resolve cleanly under TypeScript's "bundler" module resolution.
 * Both packages ship their own types in newer versions — this file just
 * makes the build robust to install-time resolution differences.
 */

declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";
  export type LucideIcon = ComponentType<
    SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }
  >;
  // Every icon used in the app — list grows as needed.
  export const ArrowRight: LucideIcon;
  export const ArrowDownToLine: LucideIcon;
  export const ArrowUpFromLine: LucideIcon;
  export const Award: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Eye: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Layers: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Loader2: LucideIcon;
  export const LogOut: LucideIcon;
  export const Medal: LucideIcon;
  export const Repeat: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const StarOff: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Trophy: LucideIcon;
  export const Zap: LucideIcon;
  // Wildcard for dynamic icon lookups via `Icons[iconName]` in achievements page.
  const _wildcard: Record<string, LucideIcon>;
  export default _wildcard;
}

declare module "date-fns" {
  export function format(date: Date | number, formatStr: string): string;
  export function parseISO(s: string): Date;
  export function differenceInDays(d1: Date | number, d2: Date | number): number;
  export function subDays(d: Date | number, n: number): Date;
}
