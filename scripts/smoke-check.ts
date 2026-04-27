import assert from 'node:assert/strict';
import { APPOINTMENTS, CLIENTS, INVENTORY, TATTOO_PROJECTS } from '../src/constants';
import { sessionManager } from '../src/lib/session_manager';
import { formatCurrency, getAppointmentFlow, getDailyPulse, getInventoryForecast } from '../src/lib/studio_logic';

function runSmokeCheck() {
  const readyAppointment = APPOINTMENTS.find((appointment) => appointment.id === '1');
  const blockedAppointment = APPOINTMENTS.find((appointment) => appointment.id === '2');
  const realismProject = TATTOO_PROJECTS.find((project) => project.id === 'p1');
  const blackInk = INVENTORY.find((item) => item.id === '1');

  assert(readyAppointment, 'Ready appointment fixture is missing.');
  assert(blockedAppointment, 'Blocked appointment fixture is missing.');
  assert(realismProject?.style === 'realism', 'Projects should carry style metadata for downstream logic.');
  assert(blackInk, 'Black ink fixture is missing.');

  const readyFlow = getAppointmentFlow(readyAppointment, CLIENTS.find((client) => client.id === readyAppointment.clientId));
  const blockedFlow = getAppointmentFlow(blockedAppointment, CLIENTS.find((client) => client.id === blockedAppointment.clientId));

  assert.equal(readyFlow.readiness, 'ready', 'Appointment #1 should be ready to start.');
  assert.equal(blockedFlow.readiness, 'blocked', 'Appointment #2 should be blocked.');
  assert(blockedFlow.blockers.includes('Waiver not signed'), 'Blocked appointment should report waiver blocker.');
  assert(blockedFlow.blockers.includes('Deposit still unpaid'), 'Blocked appointment should report deposit blocker.');

  const weeklyForecast = getInventoryForecast(blackInk, APPOINTMENTS, 'week', new Date('2026-04-03T09:00:00'));
  assert(weeklyForecast > 0, 'Inventory forecast should produce usage for upcoming sessions.');

  const pulse = getDailyPulse(new Date('2026-04-03T09:00:00'), APPOINTMENTS, INVENTORY, CLIENTS);
  assert.equal(pulse.allergyCount, 1, 'Daily pulse should count allergy-sensitive clients.');
  assert.equal(formatCurrency(pulse.expectedRevenue), '$800', 'Daily pulse revenue should use the remaining balance due for the day.');
  assert(pulse.lowStockItems.some((item) => item.id === '3'), 'Low-stock PPE should surface in daily pulse.');

  const session = sessionManager.initializeSession(readyAppointment);
  assert.equal(session.status, 'active', 'Ready appointment should start a session.');

  let blockedError = '';
  try {
    sessionManager.initializeSession(blockedAppointment);
  } catch (error) {
    blockedError = error instanceof Error ? error.message : String(error);
  }

  assert(blockedError.includes('Waiver not signed'), 'Blocked session start should explain why it failed.');

  void sessionManager.finalizeSession().then(() => {
    assert.equal(sessionManager.getActiveSession(), null, 'Finalizing should clear the active session.');
    console.log('Smoke check passed.');
  });
}

runSmokeCheck();
