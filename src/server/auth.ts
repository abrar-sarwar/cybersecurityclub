import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/server/db";
import { env, discordConfigured } from "@/server/env";
import { renderEmail, sendMail } from "@/server/mail";
import { branding } from "@config/branding";
import { ensureProfileForUser } from "@/server/services/members";

const e = env();

export const auth = betterAuth({
  appName: branding.displayName,
  baseURL: e.APP_URL,
  secret: e.AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: e.DATABASE_PROVIDER }),
  trustedOrigins: [e.APP_URL],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 200,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: `Reset your ${branding.shortName} password`,
        text: `Hi ${user.name},\n\nUse this link to choose a new password (valid for 1 hour):\n${url}\n\nIf you did not ask for this, ignore this email; your password will not change.`,
        html: renderEmail({
          heading: "Reset your password",
          paragraphs: [
            `Hi ${user.name},`,
            "Use the button below to choose a new password. The link is valid for one hour.",
            "If you did not ask for a reset, you can ignore this email and your password will not change.",
          ],
          action: { label: "Choose a new password", url },
        }),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: `Verify your email for ${branding.displayName}`,
        text: `Hi ${user.name},\n\nConfirm this email address to finish creating your account:\n${url}\n\nThe link is valid for 24 hours.`,
        html: renderEmail({
          heading: "Confirm your email address",
          paragraphs: [
            `Hi ${user.name},`,
            "Thanks for registering. Confirm this address to finish creating your account. After that, an officer will review your membership request.",
          ],
          action: { label: "Verify email", url },
        }),
      });
    },
  },

  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendMail({
          to: user.email,
          subject: `Confirm changing your ${branding.shortName} sign-in email`,
          text: `Hi ${user.name},\n\nA request was made to change your sign-in email to ${newEmail}. If that was you, approve it here:\n${url}\n\nIf you did not request this, do not click the link and consider resetting your password.`,
          html: renderEmail({
            heading: "Approve your email change",
            paragraphs: [
              `Hi ${user.name},`,
              `A request was made to change the sign-in email on your account to ${newEmail}.`,
              "If that was you, approve the change with the button below. A verification message will then be sent to the new address.",
              "If you did not request this, do not approve it and consider resetting your password.",
            ],
            action: { label: "Approve email change", url },
          }),
        });
      },
    },
    deleteUser: {
      enabled: false,
    },
  },

  socialProviders: discordConfigured()
    ? {
        discord: {
          clientId: e.DISCORD_CLIENT_ID as string,
          clientSecret: e.DISCORD_CLIENT_SECRET as string,
          scope: ["identify", "email", "guilds"],
          // Linking only: Discord is not a sign-up route on its own because
          // membership needs the registration details collected on the form.
          disableSignUp: true,
        },
      }
    : undefined,

  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  rateLimit: {
    enabled: e.NODE_ENV === "production",
    window: 60,
    max: 60,
  },

  advanced: {
    database: { generateId: "uuid" },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureProfileForUser(user.id, user.email);
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export type Auth = typeof auth;
