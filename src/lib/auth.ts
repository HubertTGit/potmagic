import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Resend } from 'resend'
import { db } from '../db'
import * as schema from '../db/schema'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'actor',
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: user.email,
        subject: 'Reset your honeypotmagic password',
        html: `
          <p>You requested a password reset.</p>
          <p><a href="${url}">Click here to reset your password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        `,
      })
    },
  },
  plugins: [tanstackStartCookies()],
})
