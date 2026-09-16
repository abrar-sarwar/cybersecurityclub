import "server-only";
import { branding } from "@config/branding";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createVerificationToken, hashToken } from "@/lib/tokens";
import { renderEmail, sendEmail } from "@/server/email";
import { hitIpRateLimit, hitRateLimit, LIMITS } from "@/server/rate-limit";
import type { Viewer } from "@/server/session";

export type VerificationSendResult = "sent" | "rate_limited" | "in_use" | "already_verified" | "send_failed";

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

/**
 * Attaches the student address to the member's existing account and emails a
 * single-use link. The address never becomes a separate sign-in identity:
 * GSU mail is Microsoft 365, so this link is the proof of student status.
 */
export async function sendStudentEmailVerification(viewer: Viewer, studentEmail: string): Promise<VerificationSendResult> {
  if (viewer.profile.student_email_verified_at) return "already_verified";
  const admin = createAdminClient();

  // Limit first, so the "already verified elsewhere" answer cannot be used to
  // probe which student addresses belong to members.
  const allowed =
    (await hitRateLimit(LIMITS.verificationPerUser, viewer.id)) &&
    (await hitRateLimit(LIMITS.verificationPerUserDaily, viewer.id)) &&
    (await hitIpRateLimit(LIMITS.verificationPerIp));

  const { data: taken, error: takenError } = await admin
    .from("profiles")
    .select("id")
    .eq("student_email", studentEmail)
    .not("student_email_verified_at", "is", null)
    .neq("id", viewer.id)
    .limit(1);
  if (takenError) throw takenError;
  if (taken.length) return "in_use";

  if (!allowed) {
    // Keep the address so onboarding can finish; the member can resend later.
    if (viewer.profile.student_email !== studentEmail) {
      const { error } = await admin
        .from("profiles")
        .update({ student_email: studentEmail })
        .eq("id", viewer.id)
        .is("student_email_verified_at", null);
      if (error) throw error;
    }
    return "rate_limited";
  }

  const token = createVerificationToken();
  const tokenHash = hashToken(token);
  const { error } = await admin.rpc("request_student_email_verification", {
    p_user_id: viewer.id,
    p_email: studentEmail,
    p_token_hash: tokenHash,
    p_expires_at: new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString(),
  });
  if (error) {
    if (error.code === "23505") return "in_use";
    if (error.code === "23514") return "already_verified";
    throw error;
  }

  const url = absoluteUrl(`/verify-student-email?token=${token}`);
  const name = viewer.profile.full_name ?? "there";
  try {
    await sendEmail(
      {
        to: studentEmail,
        subject: `Confirm your GSU student email for ${branding.shortName}`,
        text: `Hi ${name},\n\nConfirm this student email to unlock member features:\n${url}\n\nOpen it while signed in to your club account. The link works once and expires in 24 hours. If you did not add this address to a club account yourself, ignore this email.`,
        html: renderEmail({
          heading: "Confirm your student email",
          paragraphs: [
            `Hi ${name},`,
            `Confirm that this GSU student email belongs to you to unlock member features on the ${branding.displayName} site.`,
            "Open it while signed in to your club account. The link works once and expires in 24 hours.",
          ],
          action: { label: "Confirm student email", url },
          footer: "If you did not add this address to a club account yourself, ignore this email. Nothing changes unless you confirm while signed in to that account.",
        }),
      },
      `student-verification/${tokenHash}`,
    );
  } catch (sendError) {
    console.error("[student-email] send failed", sendError);
    return "send_failed";
  }
  return "sent";
}
