export const APPOINTMENT_STATUS = ['unconfirmed','deposit_paid','ready','attention','blocked','done','cancelled'] as const;
export type AppointmentStatus = typeof APPOINTMENT_STATUS[number];
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  unconfirmed:'#fbbf24', deposit_paid:'#60a5fa', ready:'#34d399',
  attention:'#f87171', blocked:'#9ca3af', done:'#6b7280', cancelled:'#4b5563',
};
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  unconfirmed:'待确认', deposit_paid:'已付定金', ready:'就绪',
  attention:'需注意', blocked:'已阻止', done:'已完成', cancelled:'已取消',
};
export function getNextStatus(current: AppointmentStatus): AppointmentStatus|null {
  const flow: Record<string,AppointmentStatus> = {
    unconfirmed:'deposit_paid', deposit_paid:'ready', ready:'done',
    attention:'ready', blocked:'ready',
  };
  return flow[current]||null;
}
