// Sends automatic event pushes and authenticated admin broadcasts through OneSignal.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_ID = "876e30fb-b69f-49da-a8aa-e90bf0240723";
const ALLOWED_ORIGINS = new Set(["https://hapn.info", "https://www.hapn.info"]);
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const requestId = crypto.randomUUID();
  const headers: Record<string, string> = {
    ...SECURITY_HEADERS, "Content-Type": "application/json", "Vary": "Origin", "X-Request-ID": requestId,
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "authorization, apikey, content-type, x-client-info, x-request-id";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  }
  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify({ ...body, request_id: requestId }), { status, headers });
  const fail = (code: string, status = 500) => {
    console.error("[send-event-push]", requestId, code);
    return json({ error: "The request could not be completed. Please try again.", code: "REQUEST_FAILED" }, status);
  };
  if (req.method === "OPTIONS") return new Response(null, { status: ALLOWED_ORIGINS.has(origin) ? 204 : 403, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Authentication required" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const oneSignalKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !oneSignalKey) return fail("missing_server_configuration");

    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: adminRow, error: adminError } = await adminClient
      .from("admins").select("user_id,role").eq("user_id", authData.user.id).eq("role", "admin").maybeSingle();
    if (adminError) return fail("admin_authorization_lookup_failed");
    if (!adminRow) return json({ error: "Admin access required" }, 403);

    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "Invalid request body" }, 400);
      body = parsed as Record<string, unknown>;
    } catch { return json({ error: "Invalid request body" }, 400); }

    if (body.action === "broadcast") {
      const title = String(body.title || "").trim().slice(0, 80);
      const message = String(body.message || "").trim().slice(0, 180);
      const audience = body.audience === "college" ? "college" : body.audience === "all" ? "all" : "";
      const collegeId = String(body.collegeId || "");
      const rawUrl = String(body.url || "/");
      if (!title || !message || !audience) return json({ error: "Title, message and audience are required." }, 400);
      if (!rawUrl.startsWith("/") || rawUrl.startsWith("//") || rawUrl.includes("\\") || /[\r\n]/.test(rawUrl)) {
        return json({ error: "Use a valid Hapn page link." }, 400);
      }
      let targetUrl: string;
      try {
        const parsedUrl = new URL(rawUrl, "https://hapn.info");
        if (parsedUrl.origin !== "https://hapn.info") return json({ error: "Only Hapn links are allowed." }, 400);
        targetUrl = parsedUrl.href;
      } catch { return json({ error: "Use a valid Hapn page link." }, 400); }

      let payload: Record<string, unknown> = {
        app_id: APP_ID, target_channel: "push",
        headings: { en: title }, contents: { en: message }, url: targetUrl,
      };
      let recipientCount: number | null = null;
      if (audience === "all") {
        payload.included_segments = ["Subscribed Users"];
      } else {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collegeId)) {
          return json({ error: "Choose a valid college." }, 400);
        }
        const { data: college, error: collegeError } = await adminClient.from("colleges")
          .select("id,name,is_active").eq("id", collegeId).eq("is_active", true).maybeSingle();
        if (collegeError) return fail("college_lookup_failed");
        if (!college) return json({ error: "College not found or inactive." }, 404);
        const ids: string[] = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await adminClient.from("campus_members").select("user_id")
            .eq("college_id", collegeId).order("user_id").range(offset, offset + 999);
          if (error) return fail("college_recipients_lookup_failed");
          ids.push(...(data || []).map((row: { user_id: string }) => row.user_id));
          if ((data || []).length < 1000) break;
          if (ids.length > 20000) return json({ error: "This college audience is too large for one broadcast. Please contact support." }, 413);
        }
        recipientCount = ids.length;
        if (!ids.length) return json({ sent: false, recipients: 0, message: "No eligible campus members were found." });
        payload.include_aliases = { external_id: ids };
        // Also create an in-app notification for members of this college.
        for (let offset = 0; offset < ids.length; offset += 500) {
          const rows = ids.slice(offset, offset + 500).map(user_id => ({
            user_id, college_id: collegeId, notification_type: "announcement",
            message: title + ": " + message, target_url: targetUrl,
          }));
          const { error } = await adminClient.from("campus_notifications").insert(rows);
          if (error) return fail("in_app_notification_insert_failed");
        }
      }

      const response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: { "Authorization": "Key " + oneSignalKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return fail("onesignal_delivery_failed", 502);
      return json({ sent: true, recipients: recipientCount, id: typeof result.id === "string" ? result.id : null });
    }

    // Existing automatic event-notification path.
    const eventId = String(body.eventId || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
      return json({ error: "Invalid event ID" }, 400);
    }
    const { data: event, error: eventError } = await adminClient.from("events")
      .select("id,title,category,short_description,description,is_published")
      .eq("id", eventId).maybeSingle();
    if (eventError) return fail("event_lookup_failed");
    if (!event) return json({ error: "Event not found" }, 404);
    if (!event.is_published) return json({ skipped: true, reason: "Event is not published" });
    const category = String(event.category || "");
    const title = String(event.title || "New Hapn event");
    if (!/workshop|hackathon|technical|fest/i.test(category + " " + title)) {
      return json({ skipped: true, reason: "Not an important event category" });
    }
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Authorization": "Key " + oneSignalKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: APP_ID, included_segments: ["Subscribed Users"],
        headings: { en: "New on Hapn: " + title },
        contents: { en: String(event.short_description || event.description || "Open Hapn to see event details.").slice(0, 180) },
        url: "https://hapn.info/event/?id=" + encodeURIComponent(event.id), target_channel: "push",
      }),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return fail("onesignal_delivery_failed", 502);
    return json({ sent: true, id: result.id || null });
  } catch (_) { return fail("unexpected_handler_error"); }
});
