import { Appointment, SessionState } from '../types';
import { getAppointmentFlow } from './studio_logic';

export class SessionManager {
  private static instance: SessionManager;
  private activeSession: SessionState | null = null;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize a new session from an appointment
   */
  public initializeSession(appointment: Appointment): SessionState {
    const flow = getAppointmentFlow(appointment);
    if (flow.readiness === 'blocked') {
      throw new Error(`Cannot start session: ${flow.blockers.join(', ')}.`);
    }

    if (flow.readiness === 'completed') {
      throw new Error('Cannot start session: Appointment is already completed.');
    }

    const session: SessionState = {
      id: `session_${Date.now()}`,
      appointmentId: appointment.id,
      startTime: new Date(),
      status: 'active',
      usedSupplies: [],
      media: []
    };

    this.activeSession = session;
    console.log(`Session initialized for appointment ${appointment.id}`);
    
    // Auto-load presets based on style
    this.loadPresets(appointment.tattooStyle);

    return session;
  }

  private loadPresets(style: string) {
    console.log(`Loading presets for style: ${style}`);
    // Logic to load preset needles, inks, etc.
  }

  /**
   * Capture media and auto-tag it
   */
  public captureSessionMedia(url: string, type: 'day0' | 'day30', metadata: { needle: string; ink: string }) {
    if (!this.activeSession) return;

    const mediaEntry = {
      url,
      type,
      timestamp: new Date(),
      tags: [
        `Session_${this.activeSession.id}`,
        `Needle_${metadata.needle}`,
        `Ink_${metadata.ink}`,
        type === 'day0' ? 'Fresh' : 'Healed'
      ]
    };

    this.activeSession.media.push(mediaEntry);
    console.log('Media captured and tagged:', mediaEntry.tags);
  }

  /**
   * Finalize the session
   */
  public async finalizeSession(): Promise<void> {
    if (!this.activeSession) return;

    this.activeSession.endTime = new Date();
    this.activeSession.status = 'completed';

    // 1. Deduct supplies from inventory (simulated)
    await this.deductSupplies(this.activeSession.usedSupplies);

    // 2. Trigger AI Aftercare (simulated)
    this.triggerAIAftercare();

    // 3. Generate Thank You Card (simulated)
    this.generateThankYouCard();

    console.log('Session finalized successfully.');
    this.activeSession = null;
  }

  private async deductSupplies(supplies: { id: string; quantity: number }[]) {
    console.log('Deducting supplies from inventory:', supplies);
  }

  private triggerAIAftercare() {
    console.log('AI Aftercare process started for 14 days.');
  }

  private generateThankYouCard() {
    console.log('Thank you card generated and sent to client.');
  }

  public getActiveSession(): SessionState | null {
    return this.activeSession;
  }
}

export const sessionManager = SessionManager.getInstance();
