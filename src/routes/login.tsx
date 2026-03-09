import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useState } from 'react'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

type Tab = 'login' | 'register'

function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login')

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: `
          radial-gradient(ellipse 60% 50% at 50% 45%,
            oklch(78% 0.16 75 / 0.12) 0%,
            oklch(78% 0.16 75 / 0.04) 40%,
            transparent 70%
          ),
          oklch(9% 0.02 265)
        `,
      }}
    >
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      <div className="relative w-full max-w-sm mx-4">
        {/* Card */}
        <div
          className="rounded-box overflow-hidden"
          style={{
            background: 'oklch(13% 0.028 262 / 0.95)',
            border: '1px solid oklch(78% 0.16 75 / 0.25)',
            boxShadow: `
              0 0 60px oklch(78% 0.16 75 / 0.08),
              0 25px 50px oklch(0% 0 0 / 0.5),
              inset 0 1px 0 oklch(78% 0.16 75 / 0.15)
            `,
          }}
        >
          {/* Brand header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <h1
              className="text-5xl leading-none mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 600,
                color: 'oklch(78% 0.16 75)',
                textShadow: '0 0 40px oklch(78% 0.16 75 / 0.4)',
                letterSpacing: '-0.01em',
              }}
            >
              honeypotmagic
            </h1>
            <p
              className="text-sm tracking-widest uppercase"
              style={{
                color: 'oklch(60% 0.02 265)',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                letterSpacing: '0.25em',
              }}
            >
              Enter the stage
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex mx-8 mb-6"
            style={{ borderBottom: '1px solid oklch(78% 0.16 75 / 0.15)' }}
          >
            {(['login', 'register'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab ? 'oklch(78% 0.16 75)' : 'oklch(50% 0.02 265)',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
                {activeTab === tab && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'oklch(78% 0.16 75)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="px-8 pb-8">
            {activeTab === 'login' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs tracking-wider uppercase"
                    style={{ color: 'oklch(55% 0.02 265)', letterSpacing: '0.1em' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 rounded-field text-sm outline-none transition-all"
                    style={{
                      background: 'oklch(18% 0.028 262)',
                      border: '1px solid oklch(35% 0.02 265)',
                      color: 'oklch(90% 0.005 265)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(78% 0.16 75 / 0.6)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px oklch(78% 0.16 75 / 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(35% 0.02 265)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs tracking-wider uppercase"
                    style={{ color: 'oklch(55% 0.02 265)', letterSpacing: '0.1em' }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-field text-sm outline-none transition-all"
                    style={{
                      background: 'oklch(18% 0.028 262)',
                      border: '1px solid oklch(35% 0.02 265)',
                      color: 'oklch(90% 0.005 265)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(78% 0.16 75 / 0.6)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px oklch(78% 0.16 75 / 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(35% 0.02 265)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-1 rounded-field text-sm font-semibold tracking-wide transition-all"
                  style={{
                    background: 'oklch(78% 0.16 75)',
                    color: 'oklch(12% 0.04 75)',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '1.05rem',
                    letterSpacing: '0.08em',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px oklch(78% 0.16 75 / 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'oklch(83% 0.16 75)'
                    e.currentTarget.style.boxShadow = '0 4px 28px oklch(78% 0.16 75 / 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'oklch(78% 0.16 75)'
                    e.currentTarget.style.boxShadow = '0 4px 20px oklch(78% 0.16 75 / 0.3)'
                  }}
                >
                  Sign In
                </button>

                <p
                  className="text-center text-xs mt-1"
                  style={{ color: 'oklch(50% 0.02 265)' }}
                >
                  No seat yet?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="transition-colors"
                    style={{
                      color: 'oklch(78% 0.16 75)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                    }}
                  >
                    Register →
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs tracking-wider uppercase"
                    style={{ color: 'oklch(55% 0.02 265)', letterSpacing: '0.1em' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 rounded-field text-sm outline-none transition-all"
                    style={{
                      background: 'oklch(18% 0.028 262)',
                      border: '1px solid oklch(35% 0.02 265)',
                      color: 'oklch(90% 0.005 265)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(78% 0.16 75 / 0.6)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px oklch(78% 0.16 75 / 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(35% 0.02 265)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs tracking-wider uppercase"
                    style={{ color: 'oklch(55% 0.02 265)', letterSpacing: '0.1em' }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-field text-sm outline-none transition-all"
                    style={{
                      background: 'oklch(18% 0.028 262)',
                      border: '1px solid oklch(35% 0.02 265)',
                      color: 'oklch(90% 0.005 265)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(78% 0.16 75 / 0.6)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px oklch(78% 0.16 75 / 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(35% 0.02 265)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs tracking-wider uppercase"
                    style={{ color: 'oklch(55% 0.02 265)', letterSpacing: '0.1em' }}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-field text-sm outline-none transition-all"
                    style={{
                      background: 'oklch(18% 0.028 262)',
                      border: '1px solid oklch(35% 0.02 265)',
                      color: 'oklch(90% 0.005 265)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(78% 0.16 75 / 0.6)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px oklch(78% 0.16 75 / 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(35% 0.02 265)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-1 rounded-field text-sm font-semibold tracking-wide transition-all"
                  style={{
                    background: 'oklch(78% 0.16 75)',
                    color: 'oklch(12% 0.04 75)',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '1.05rem',
                    letterSpacing: '0.08em',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px oklch(78% 0.16 75 / 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'oklch(83% 0.16 75)'
                    e.currentTarget.style.boxShadow = '0 4px 28px oklch(78% 0.16 75 / 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'oklch(78% 0.16 75)'
                    e.currentTarget.style.boxShadow = '0 4px 20px oklch(78% 0.16 75 / 0.3)'
                  }}
                >
                  Reserve your seat
                </button>

                <p
                  className="text-center text-xs mt-1"
                  style={{ color: 'oklch(50% 0.02 265)' }}
                >
                  Already have a seat?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="transition-colors"
                    style={{
                      color: 'oklch(78% 0.16 75)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                    }}
                  >
                    Sign in →
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
