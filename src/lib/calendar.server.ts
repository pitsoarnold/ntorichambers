import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, getSupabaseUser } from "@/lib/supabase-session.server";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleCalendarBooking = {
  client_name: string;
  client_email: string;
  client_phone: string | null;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
};

const bookingIdValidator = z.object({ bookingId: z.string().min(1).max(128) });

export const createCalendarEvent = createServerFn({ method: "POST" })
  .validator(bookingIdValidator)
  .handler(async ({ data }) => {
    const user = await getSupabaseUser();
    if (!user) {
      throw new Error("Admin authentication is required to create calendar events.");
    }

    const supabase = getSupabaseServerClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "client_name, client_email, client_phone, service_type, booking_date, booking_time, status",
      )
      .eq("id", data.bookingId)
      .maybeSingle();

    if (bookingError) {
      throw bookingError;
    }
    if (!booking || booking.status !== "confirmed") {
      throw new Error("Only confirmed bookings can be added to Google Calendar.");
    }

    const calendarBooking = booking as GoogleCalendarBooking;
    const clientId = process.env["GOOGLE_CLIENT_ID"];
    const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
    if (!clientId || !clientSecret) {
      throw new Error("Google Calendar integration is not configured.");
    }

    const { data: authRecord, error: authRecordError } = await supabase
      .from("google_auth")
      .select("refresh_token")
      .limit(1)
      .maybeSingle();
    if (authRecordError) {
      throw authRecordError;
    }
    if (!authRecord?.refresh_token) {
      throw new Error("Google Calendar is not connected.");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: authRecord.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const token = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !token.access_token) {
      throw new Error(
        `Google access token refresh failed: ${token.error_description ?? token.error ?? tokenResponse.status}`,
      );
    }

    const start = toCalendarDateTime(calendarBooking.booking_date, calendarBooking.booking_time);
    const end = toCalendarDateTime(calendarBooking.booking_date, calendarBooking.booking_time, 1);
    const eventResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `Consultation: ${calendarBooking.client_name}`,
          description:
            `Service: ${calendarBooking.service_type}\n` +
            `Phone: ${calendarBooking.client_phone ?? "Not provided"}\n` +
            `Email: ${calendarBooking.client_email}`,
          start: { dateTime: start, timeZone: "Africa/Maseru" },
          end: { dateTime: end, timeZone: "Africa/Maseru" },
          attendees: [{ email: calendarBooking.client_email }],
        }),
      },
    );
    if (!eventResponse.ok) {
      console.error("Google Calendar event creation failed.", eventResponse.status);
      throw new Error(`Google Calendar event creation failed (${eventResponse.status}).`);
    }

    return { success: true };
  });

function toCalendarDateTime(date: string, time: string, hoursToAdd = 0) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new Error("The booking date or time is invalid.");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? 0);
  const instant = new Date(Date.UTC(year, month - 1, day, hour + hoursToAdd, minute, second));

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new Error("The booking date or time is invalid.");
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${instant.getUTCFullYear()}-${pad(instant.getUTCMonth() + 1)}-${pad(instant.getUTCDate())}`,
    `T${pad(instant.getUTCHours())}:${pad(instant.getUTCMinutes())}:${pad(instant.getUTCSeconds())}`,
  ].join("");
}
