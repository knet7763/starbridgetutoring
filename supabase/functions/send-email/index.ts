// Supabase Edge Function: send-email (Deno 1.40+ native Deno.serve)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ──────────────────────────────────────────────────────────────────────────────
// Email templates
// ──────────────────────────────────────────────────────────────────────────────

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  /** Sent to teacher when a student books a session */
  booking_created_teacher: (d) => ({
    subject: `📅 New Booking from ${d.studentName} – ${d.date}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:#F59E0B;padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">New Booking Request 📅</h1>
          <p style="color:#FEF3C7;margin:6px 0 0;font-size:14px">StarBridge Tutoring</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:16px;color:#111827;margin:0 0 20px">Hi ${d.teacherName},</p>
          <p style="color:#374151;font-size:15px"><strong>${d.studentName}</strong> has booked a session with you:</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#FFFBEB;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 16px;font-weight:600;color:#92400E;font-size:13px;width:120px">Date</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.date}</td></tr>
            <tr style="background:#FEF3C7"><td style="padding:10px 16px;font-weight:600;color:#92400E;font-size:13px">Time</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.startTime} – ${d.endTime}</td></tr>
            <tr><td style="padding:10px 16px;font-weight:600;color:#92400E;font-size:13px">Subject</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.subject || "General"}</td></tr>
          </table>
          <p style="color:#6B7280;font-size:14px">Log in to your dashboard to confirm or manage this booking.</p>
          <a href="${d.dashboardUrl || "https://starbridgetutors.com/teacher/dashboard"}" style="display:inline-block;margin-top:12px;background:#F59E0B;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">Open Dashboard →</a>
        </div>
        <div style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF">StarBridge Tutoring · starbridgetutors.com</div>
      </div>`,
  }),

  /** Sent to student when teacher confirms their booking */
  booking_confirmed_student: (d) => ({
    subject: `✅ Your Session is Confirmed – ${d.date}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:#10B981;padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Session Confirmed ✅</h1>
          <p style="color:#D1FAE5;margin:6px 0 0;font-size:14px">StarBridge Tutoring</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:16px;color:#111827;margin:0 0 20px">Hi ${d.studentName}!</p>
          <p style="color:#374151;font-size:15px">Great news — your session with <strong>${d.teacherName}</strong> is confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#ECFDF5;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 16px;font-weight:600;color:#065F46;font-size:13px;width:120px">Date</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.date}</td></tr>
            <tr style="background:#D1FAE5"><td style="padding:10px 16px;font-weight:600;color:#065F46;font-size:13px">Time</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.startTime} – ${d.endTime}</td></tr>
            <tr><td style="padding:10px 16px;font-weight:600;color:#065F46;font-size:13px">Tutor</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.teacherName}</td></tr>
          </table>
          <p style="color:#6B7280;font-size:14px">You'll be able to join the meeting room from your student dashboard 15 minutes before the session starts.</p>
          <a href="${d.dashboardUrl || "https://starbridgetutors.com/student/dashboard"}" style="display:inline-block;margin-top:12px;background:#10B981;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">View My Sessions →</a>
        </div>
        <div style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF">StarBridge Tutoring · starbridgetutors.com</div>
      </div>`,
  }),

  /** Sent to admin/teacher when a trial request is submitted */
  trial_request_admin: (d) => ({
    subject: `🎯 New Trial Request from ${d.parentName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:#8B5CF6;padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">New Trial Request 🎯</h1>
          <p style="color:#EDE9FE;margin:6px 0 0;font-size:14px">StarBridge Tutoring</p>
        </div>
        <div style="padding:32px">
          <p style="color:#374151;font-size:15px">A new trial session request has been submitted:</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#F5F3FF;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 16px;font-weight:600;color:#4C1D95;font-size:13px;width:130px">Parent</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.parentName}</td></tr>
            <tr style="background:#EDE9FE"><td style="padding:10px 16px;font-weight:600;color:#4C1D95;font-size:13px">Student</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.studentName}</td></tr>
            <tr><td style="padding:10px 16px;font-weight:600;color:#4C1D95;font-size:13px">Email</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.email}</td></tr>
            <tr style="background:#EDE9FE"><td style="padding:10px 16px;font-weight:600;color:#4C1D95;font-size:13px">Phone</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.phone || "Not provided"}</td></tr>
            <tr><td style="padding:10px 16px;font-weight:600;color:#4C1D95;font-size:13px">Subject</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.subject || "Not specified"}</td></tr>
            <tr style="background:#EDE9FE"><td style="padding:10px 16px;font-weight:600;color:#4C1D95;font-size:13px">Message</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.message || "—"}</td></tr>
          </table>
          <a href="${d.dashboardUrl || "https://starbridgetutors.com/admin"}" style="display:inline-block;margin-top:12px;background:#8B5CF6;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">View in Admin Dashboard →</a>
        </div>
        <div style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF">StarBridge Tutoring · starbridgetutors.com</div>
      </div>`,
  }),

  /** Reminder sent to student 30 min before a session */
  session_reminder_student: (d) => ({
    subject: `⏰ Reminder: Your session starts in 30 minutes!`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:#3B82F6;padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Session Starting Soon ⏰</h1>
          <p style="color:#DBEAFE;margin:6px 0 0;font-size:14px">StarBridge Tutoring</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:16px;color:#111827;margin:0 0 20px">Hi ${d.studentName}!</p>
          <p style="color:#374151;font-size:15px">Your session with <strong>${d.teacherName}</strong> starts in <strong>30 minutes</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#EFF6FF;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 16px;font-weight:600;color:#1E40AF;font-size:13px;width:120px">Date</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.date}</td></tr>
            <tr style="background:#DBEAFE"><td style="padding:10px 16px;font-weight:600;color:#1E40AF;font-size:13px">Time</td><td style="padding:10px 16px;color:#111827;font-size:14px">${d.startTime}</td></tr>
          </table>
          <p style="color:#6B7280;font-size:14px">Make sure your camera and microphone are ready. Join from your dashboard.</p>
          <a href="${d.dashboardUrl || "https://starbridgetutors.com/student/dashboard"}" style="display:inline-block;margin-top:12px;background:#3B82F6;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">Join Session →</a>
        </div>
        <div style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF">StarBridge Tutoring · starbridgetutors.com</div>
      </div>`,
  }),
};

// ──────────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { templateId, to, data = {} } = await req.json();

    if (!templateId || !to) {
      return jsonResponse({ error: "Missing required fields: templateId, to" }, 400);
    }

    const builder = templates[templateId];
    if (!builder) {
      return jsonResponse({ error: `Unknown email template: ${templateId}` }, 400);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not set");
      return jsonResponse({ error: "Email service not configured" }, 500);
    }

    const { subject, html } = builder(data);

    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "StarBridge Tutoring <notifications@starbridgetutors.com>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Resend API error:", errorBody);
      return jsonResponse({ error: "Failed to send email", details: errorBody }, 502);
    }

    const result = await res.json();
    return jsonResponse({ success: true, messageId: result.id });
  } catch (err) {
    console.error("send-email function error:", err);
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});
