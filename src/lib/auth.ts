import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { magicLink } from 'better-auth/plugins'
import { Resend } from 'resend'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
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
        defaultValue: 'director',
      },
      subscription: {
        type: 'string',
        defaultValue: 'free',
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ['google'],
    },
  },
  plugins: [
    tanstackStartCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: process.env.FROM_EMAIL!,
          to: email,
          subject: 'Your potmagic sign-in link',
          html: `
            <p>Click the link below to sign in to potmagic.</p>
            <p><a href="${url}">Sign in to potmagic</a></p>
            <p>This link expires in 5 minutes. If you didn't request this, ignore this email.</p>
          `,
        })
        if (error) {
          console.error('[magic-link] Resend error:', error)
          throw new Error(error.message)
        }
      },
      expiresIn: 300,
    }),
  ],
})
