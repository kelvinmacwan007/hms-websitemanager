import { readLimitedText } from "@/lib/api/body";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { requestOrigin } from "@/lib/api/origin";
import { allowRequest } from "@/lib/api/rateLimit";
import { pageEnabled } from "@/lib/website/pages";
import { isMockMode } from "@/lib/api/mode";
import { HMS_READ_ONLY } from "@/lib/api/hmsPolicy";
import { getWebsiteProvider } from "@/lib/api/provider";
import { resolveDemoSelection } from "@/lib/booking/demoSelection";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { parseHmsGuest, validateReservationRooms } from "@/lib/booking/hmsValidation";
import { guestParty, partySummary } from "@/lib/booking/party";
import {
  HMS_COOKIE,
  validBookingToken,
  readHmsSession,
  writeHmsSession,
  withHmsSessionLock,
  type HmsBookingSession,
} from "@/lib/booking/hmsSession";
import { getHmsConnection, getHmsWebsiteIntegration } from "@/services/patelHms/websiteIntegration";
import { getHmsStayTimes } from "@/services/patelHms/propertyContext";
import type { Tenant } from "@/types/hotel";
import type {
  HmsCardPaymentRequest,
  HmsReservationRoom,
} from "@/services/patelHms/integrationTypes";

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "cache-control": "no-store" } });

async function ownedSession(tenant: Tenant) {
  const token = (await cookies()).get(HMS_COOKIE)?.value;
  if (!validBookingToken(token)) throw new Error("Booking access expired.");
  const session = await readHmsSession(tenant.id, token);
  if (
    !session ||
    session.propertyId !== getHmsConnection(tenant).propertyId ||
    !session.reservationId
  )
    throw new Error("Booking access expired.");
  return { token, session };
}

async function details(tenant: Tenant, session: HmsBookingSession) {
  const api = getHmsWebsiteIntegration(tenant);
  const [reservation, payment] = await Promise.all([
    api.getReservationDetails(session.reservationId!),
    api.getPaymentDetails(session.reservationId!),
  ]);
  if (
    reservation.propertyId !== session.propertyId ||
    payment.propertyId !== session.propertyId ||
    payment.reservationId !== session.reservationId ||
    !Number.isFinite(reservation.balanceAmount) ||
    reservation.balanceAmount < 0 ||
    !Number.isFinite(payment.totalPayable) ||
    payment.totalPayable < 0
  )
    throw new Error("Invalid reservation verification.");
  return { reservation, payment };
}

export async function GET(request: Request) {
  if (isMockMode()) return json({ error: "Live booking is not enabled." }, 503);
  try {
    const tenant = await resolveTenant();
    if (!allowRequest(`hms-read:${tenant.id}`, 120))
      return json({ error: "Please try again shortly." }, 429);
    const api = getHmsWebsiteIntegration(tenant);
    const params = new URL(request.url).searchParams;
    const action = params.get("action");
    const id = Number(params.get("id"));
    if (action === "countries") return json({ data: await api.getCountries() });
    if ((action === "states" || action === "cities") && Number.isSafeInteger(id) && id > 0)
      return json({ data: await (action === "states" ? api.getStates(id) : api.getCities(id)) });
    if (action === "zipcode" && /^[a-zA-Z0-9 -]{2,16}$/.test(params.get("zipcode") ?? ""))
      return json({ data: await api.getLocationByZipcode(params.get("zipcode")!) });
    if (action === "forecast") {
      const roomId = params.get("roomId");
      const fromDate = params.get("fromDate") ?? "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !Number.isFinite(Date.parse(fromDate)))
        return json({ error: "Invalid date." }, 400);
      const room = (await getWebsiteProvider().getRooms(tenant)).find((item) => item.id === roomId);
      if (!room) return json({ error: "Room not found." }, 404);
      return json({ data: await api.getRateForecast(room.id, fromDate) });
    }
    if (action !== "status") return json({ error: "Invalid action." }, 400);
    const { session } = await ownedSession(tenant);
    const { reservation, payment } = await details(tenant, session);
    return json({
      reservationId: session.reservationId,
      state: session.state,
      currency: getHmsConnection(tenant).currency,
      checkIn: reservation.checkInDateTime,
      checkOut: reservation.checkOutDateTime,
      total: payment.totalPayable,
      balance: reservation.balanceAmount,
      reservationStatus: reservation.reservationStatus,
    });
  } catch {
    return json(
      {
        error:
          "Hotel data could not be loaded. Please contact the hotel if you already submitted a booking.",
      },
      502,
    );
  }
}

export async function POST(request: Request) {
  if (HMS_READ_ONLY)
    return json(
      { error: "Read-only testing: reservation and payment submissions are disabled." },
      403,
    );
  if (isMockMode()) return json({ error: "Live booking is not enabled." }, 503);
  if (request.headers.get("origin") !== requestOrigin(request))
    return json({ error: "Invalid origin." }, 403);
  let body: Record<string, unknown>;
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 32_000)
      return json({ error: "Request too large." }, 413);
    const text = await readLimitedText(request, 32000);
    if (text.length > 32_000) return json({ error: "Request too large." }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const tenant = await resolveTenant();
  if (!allowRequest(`hms-write:${tenant.id}`, 15))
    return json({ error: "Please try again shortly." }, 429);
  try {
    if (body.action === "resume") {
      const token = body.accessToken;
      if (!validBookingToken(token)) return json({ error: "Invalid booking access." }, 400);
      const session = await readHmsSession(tenant.id, token);
      if (!session || session.propertyId !== getHmsConnection(tenant).propertyId)
        return json({ error: "Booking attempt not found. Contact the hotel." }, 404);
      (await cookies()).set(HMS_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 86400,
      });
      return json({ reservationId: session.reservationId, state: session.state });
    }
    if (body.action === "reserve") {
      const token = body.accessToken;
      if (!validBookingToken(token) || typeof body.query !== "string" || body.query.length > 5000)
        return json({ error: "Invalid booking request." }, 400);
      const result = await withHmsSessionLock(tenant.id, token, async () => {
        const fingerprint = createHash("sha256")
          .update(JSON.stringify([body.query, body.rooms]))
          .digest("hex");
        const existing = await readHmsSession(tenant.id, token);
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            return json(
              { error: "This booking attempt has different guest details. Contact the hotel." },
              409,
            );
          if (existing.reservationId) return json({ reservationId: existing.reservationId });
          return json(
            { error: "The previous booking needs checking by the hotel. Do not resubmit it." },
            409,
          );
        }
        const provider = getWebsiteProvider();
        const hotel = await provider.getHotel(tenant);
        if (!hotel.configured || !pageEnabled(hotel, "booking"))
          return json({ error: "Online booking is not enabled for this property." }, 403);
        const params: Record<string, string | string[]> = {};
        const query = new URLSearchParams(body.query as string);
        for (const key of new Set(query.keys()))
          params[key] = query.getAll(key).length > 1 ? query.getAll(key) : query.get(key)!;
        const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
        if (!search) return json({ error: "Invalid stay." }, 400);
        const selection = resolveDemoSelection(
          params,
          hotel,
          await provider.searchAvailability(tenant, search),
        );
        if (!selection || query.has("extra") || query.has("promotionCode"))
          return json({ error: "Your selection changed. Please search again." }, 409);
        const selected = selection.lines.flatMap((line) =>
          Array.from({ length: line.quantity }, () => line.room),
        );
        let rooms: HmsReservationRoom[];
        try {
          if (!Array.isArray(body.rooms) || body.rooms.length !== selected.length)
            throw new Error("Complete guest details for each room.");
          rooms = body.rooms.map((value, index) => {
            if (!value || typeof value !== "object") throw new Error("Invalid room details.");
            const input = value as Record<string, unknown>;
            const totalChild = input.totalChild ?? 0;
            const pets = input.pets ?? 0;
            if (
              !Number.isInteger(input.totalAdult) ||
              Number(input.totalAdult) < 1 ||
              !Number.isInteger(totalChild) ||
              Number(totalChild) < 0 ||
              Number(input.totalAdult) + Number(totalChild) > selected[index].occupancy ||
              !Number.isInteger(pets) ||
              Number(pets) < 0 ||
              Number(pets) > 10
            )
              throw new Error("Invalid room occupancy.");
            if (Number(pets) > 0 && selected[index].petsAllowed === false)
              throw new Error(
                "Pets are not allowed in this room. Choose another room or remove the pet request.",
              );
            return {
              totalAdult: Number(input.totalAdult),
              totalChild: Number(totalChild),
              requestedPets: Number(pets),
              isPetAllowed: Number(pets) > 0 && selected[index].petsAllowed === true,
              ...(Number(pets) > 0
                ? {
                    specialRequest: `${pets} pet(s) requested${selected[index].petsAllowed === true ? "; pet-friendly room" : "; requires hotel confirmation"}.`,
                  }
                : {}),
              roomTypeMasterId: selected[index].id,
              guests: [parseHmsGuest(input.guest)],
            };
          });
          validateReservationRooms(rooms, search.guests, search.rooms, search);
        } catch (error) {
          return json(
            { error: error instanceof Error ? error.message : "Invalid guest details." },
            400,
          );
        }
        const session: HmsBookingSession = {
          tenantId: tenant.id,
          propertyId: getHmsConnection(tenant).propertyId,
          expiresAt: Date.now() + 86400000,
          fingerprint,
          state: "creating",
        };
        await writeHmsSession(tenant.id, token, session);
        try {
          session.reservationId = await getHmsWebsiteIntegration(tenant).createReservation({
            ...getHmsStayTimes(tenant, search),
            rooms,
            reservationNotes: `Website booking: ${partySummary(search)}.${selection.addOnRequests.length ? ` Requested services (subject to hotel confirmation): ${selection.addOnRequests.map(({ item, quantity }) => `${quantity} x ${item.name.slice(0, 100)}`).join("; ")}.` : ""}`,
          });
          await writeHmsSession(tenant.id, token, session);
          const verified = await details(tenant, session);
          if (
            verified.reservation.checkInDateTime.slice(0, 10) !== search.checkIn ||
            verified.reservation.checkOutDateTime.slice(0, 10) !== search.checkOut ||
            verified.reservation.totalRooms !== search.rooms ||
            verified.reservation.totalAdult !== guestParty(search).adults ||
            (verified.reservation.totalChild ?? 0) !== guestParty(search).children ||
            selected.some(
              (room) =>
                verified.reservation.reservationRoomTxns.filter(
                  (txn) => txn.roomTypeMasterId === room.id,
                ).length !== selected.filter((item) => item.id === room.id).length,
            )
          )
            throw new Error("Reservation stay does not match.");
          session.state = "reserved";
          await writeHmsSession(tenant.id, token, session);
          return json({ reservationId: session.reservationId });
        } catch {
          session.state = "attention";
          await writeHmsSession(tenant.id, token, session);
          return json(
            {
              error: "The hotel must check this booking attempt. Do not create another booking.",
              reservationId: session.reservationId,
            },
            502,
          );
        }
      });
      (await cookies()).set(HMS_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 86400,
      });
      return result;
    }
    if (body.action === "pay") {
      const { token, session } = await ownedSession(tenant);
      return await withHmsSessionLock(tenant.id, token, async () => {
        const current = await readHmsSession(tenant.id, token);
        if (!current || !["reserved", "declined"].includes(current.state))
          return json(
            { error: "This payment was already submitted or needs checking. Refresh the status." },
            409,
          );
        const { reservation } = await details(tenant, session);
        if (reservation.balanceAmount <= 0 || body.amount !== reservation.balanceAmount)
          return json({ error: "The payable balance changed. Refresh before paying." }, 409);
        const card = body.card as Record<string, unknown>;
        if (
          !card ||
          typeof card !== "object" ||
          typeof card.cardHolderName !== "string" ||
          !card.cardHolderName.trim() ||
          card.cardHolderName.length > 150 ||
          typeof card.cardNumber !== "string" ||
          !/^\d{12,19}$/.test(card.cardNumber.replace(/ /g, "")) ||
          typeof card.expiryDate !== "string" ||
          !/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiryDate) ||
          typeof card.securityCode !== "string" ||
          !/^\d{3,4}$/.test(card.securityCode) ||
          typeof card.cardType !== "string" ||
          !/^[A-Z ]{2,30}$/.test(card.cardType)
        )
          return json({ error: "Check your card details." }, 400);
        const payment: HmsCardPaymentRequest = {
          reservationId: session.reservationId!,
          amount: reservation.balanceAmount,
          cardHolderName: card.cardHolderName.trim(),
          cardNumber: card.cardNumber.replace(/ /g, ""),
          expiryDate: card.expiryDate,
          securityCode: card.securityCode,
          cardType: card.cardType,
          addCardToFile: false,
        };
        current.state = "paying";
        await writeHmsSession(tenant.id, token, current);
        try {
          const result = await getHmsWebsiteIntegration(tenant).payByCard(payment);
          current.state = result.success ? "paying" : "declined";
          if (result.success) {
            const verified = await details(tenant, session);
            current.state = verified.reservation.balanceAmount === 0 ? "paid" : "attention";
          }
          await writeHmsSession(tenant.id, token, current);
          return json({ state: current.state, success: current.state === "paid" });
        } catch {
          current.state = "attention";
          await writeHmsSession(tenant.id, token, current);
          return json({ error: "Payment needs checking by the hotel. Do not pay again." }, 502);
        }
      });
    }
    return json({ error: "Invalid action." }, 400);
  } catch {
    return json(
      { error: "The operation could not be completed. Check booking status before trying again." },
      502,
    );
  }
}
