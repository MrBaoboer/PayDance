export function formatDashboardDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";

  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}`;
}
