/**
 * Google Calendar Integration Service
 * Growth Lab Dental & Orthodontics
 *
 * Uses Google Apps Script Webhook Auto-Sync for Central Account: 12pasuk.system@gmail.com
 * Features:
 * - Automated background event creation, updates, and cancellations via Google Apps Script Webhook
 * - No OAuth sign-in popups or consent loops
 * - Centralized calendar management under 12pasuk.system@gmail.com
 * - Event ID tracking and direct web link fallbacks
 */

import {
  downloadAppointmentIcs,
  getGoogleCalendarWebUrl,
  saveLocalCalendarRecord,
  CalendarAppointmentItem
} from '../utils/calendarExport';
import { Appointment } from '../types';
import {
  syncAppointmentToGoogleSheets,
  syncDeleteAppointmentToGoogleSheets,
  getWebhookUrl
} from './googleAppsScriptService';

export interface GoogleCalendarConnectionStatus {
  isConnected: boolean;
  email: string;
  autoSync: boolean;
}

export const CENTRAL_CALENDAR_EMAIL = '12pasuk.system@gmail.com';

/**
 * Get current Google Calendar Connection Status (Always active via Webhook)
 */
export function getGoogleCalendarConnectionStatus(): GoogleCalendarConnectionStatus {
  return {
    isConnected: true,
    email: CENTRAL_CALENDAR_EMAIL,
    autoSync: true,
  };
}

/**
 * Initiate Google OAuth Authorization Flow (Deprecated/No-op for Webhook mode)
 */
export async function initiateGoogleCalendarOAuth(): Promise<{ success: boolean; email: string; token: string }> {
  return {
    success: true,
    email: CENTRAL_CALENDAR_EMAIL,
    token: 'webhook_auto_sync',
  };
}

/**
 * Sync appointment to Google Calendar via Google Apps Script Webhook
 */
export async function syncAppointmentToGoogleCalendar(
  appointment: Appointment
): Promise<{ googleCalendarEventId: string; googleCalendarHtmlLink: string }> {
  try {
    const webhookUrl = getWebhookUrl();
    await syncAppointmentToGoogleSheets(webhookUrl, appointment);

    const eventId = appointment.googleCalendarEventId || appointment.id || `gcal_${Date.now()}`;
    const htmlLink = appointment.googleCalendarHtmlLink || getGoogleCalendarWebUrl({
      id: appointment.id,
      patientName: appointment.patientName,
      hn: appointment.hn,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      notes: appointment.notes,
    });

    console.log('[GoogleCalendar Auto-Sync] Appointment sent to Google Calendar Webhook:', appointment.patientName);

    return {
      googleCalendarEventId: eventId,
      googleCalendarHtmlLink: htmlLink,
    };
  } catch (error) {
    console.error('[GoogleCalendar Auto-Sync] Error syncing appointment via Webhook:', error);
    return {
      googleCalendarEventId: appointment.id,
      googleCalendarHtmlLink: getGoogleCalendarWebUrl({
        id: appointment.id,
        patientName: appointment.patientName,
        hn: appointment.hn,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        notes: appointment.notes,
      }),
    };
  }
}

/**
 * Delete or cancel Google Calendar Event via Webhook
 */
export async function deleteOrCancelGoogleCalendarEvent(
  eventId: string,
  action: 'delete' | 'cancel' = 'delete',
  appointment?: Appointment
): Promise<boolean> {
  try {
    const webhookUrl = getWebhookUrl();
    if (action === 'cancel' && appointment) {
      await syncAppointmentToGoogleSheets(webhookUrl, {
        ...appointment,
        status: 'cancelled',
      });
    } else {
      await syncDeleteAppointmentToGoogleSheets(
        webhookUrl,
        eventId,
        appointment?.patientId,
        appointment?.hn,
        appointment?.date
      );
    }
    console.log(`[GoogleCalendar Auto-Sync] Event ${eventId} ${action}d via Webhook.`);
    return true;
  } catch (err) {
    console.error(`[GoogleCalendar Auto-Sync] Error deleting/cancelling event ${eventId}:`, err);
    return false;
  }
}

/**
 * Batch sync multiple pending appointments via Google Apps Script Webhook
 */
export async function syncAllAppointmentsToGoogleCalendar(
  appointments: Appointment[]
): Promise<{ syncedCount: number; errorsCount: number }> {
  let syncedCount = 0;
  let errorsCount = 0;

  for (const appt of appointments) {
    if (appt.status === 'cancelled') continue;
    try {
      await syncAppointmentToGoogleCalendar(appt);
      syncedCount++;
    } catch (err) {
      console.error(`[GoogleCalendar Batch Auto-Sync] Error syncing ${appt.patientName}:`, err);
      errorsCount++;
    }
  }

  return { syncedCount, errorsCount };
}

/**
 * Legacy compatibility stubs
 */
export function disconnectGoogleCalendar(): void {
  console.log('[GoogleCalendar] Disconnected (Webhook auto-sync remains active)');
}

export function saveOAuthToken(): void {}

export function getValidOAuthToken(): string | null {
  return 'webhook_auto_sync';
}

export { downloadAppointmentIcs, getGoogleCalendarWebUrl, saveLocalCalendarRecord };
