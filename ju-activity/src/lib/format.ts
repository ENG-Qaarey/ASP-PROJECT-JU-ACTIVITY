export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

import { UI } from "@/constants/ui";

export const formatRelativeTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return UI.TIME.JUST_NOW;
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const formatDateLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return UI.TIME.TODAY;
  if (d.toDateString() === yesterday.toDateString()) return UI.TIME.YESTERDAY;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const groupByDate = <T extends { createdAt: string }>(
  items: T[],
  dateAccessor: (item: T) => string = (item) => formatDateLabel(item.createdAt)
): { date: string; items: T[] }[] =>
  items.reduce<{ date: string; items: T[] }[]>((groups, item) => {
    const label = dateAccessor(item);
    const last = groups[groups.length - 1];
    if (last && last.date === label) last.items.push(item);
    else groups.push({ date: label, items: [item] });
    return groups;
  }, []);
