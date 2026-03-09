import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useState } from 'react'
import { cn } from '../lib/cn'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

type Tab = 'login' | 'register'

const inputClass =
  'w-full px-3 py-2.5 rounded-field text-sm bg-base-200 border border-base-300 text-base-content outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all'

const labelClass = 'text-xs tracking-[0.1em] uppercase text-base-content/40'

function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login')

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center login-bg">
      <div className="relative w-full max-w-sm mx-4">
        {/* Card */}
        <div className="login-card rounded-box overflow-hidden border border-gold/25">
          {/* Brand header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <h1 className="font-display italic font-semibold text-5xl leading-none mb-2 text-gold gold-glow tracking-[-0.01em]">
              honeypotmagic
            </h1>
            <p className="font-display text-sm tracking-[0.25em] uppercase text-base-content/40">
              Enter the stage
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex mx-8 mb-6 border-b border-gold/15">
            {(['login', 'register'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2 font-display text-base tracking-[0.05em] transition-colors relative bg-transparent border-0 cursor-pointer',
                  activeTab === tab ? 'text-gold' : 'text-base-content/30',
                )}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-gold" />
                )}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="px-8 pb-8">
            {activeTab === 'login' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Password</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-1 rounded-field font-display text-base tracking-[0.08em] btn-gold transition-all cursor-pointer"
                >
                  Sign In
                </button>

                <p className="text-center text-xs text-base-content/40 mt-1">
                  No seat yet?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-gold bg-transparent border-0 cursor-pointer p-0 font-inherit text-xs"
                  >
                    Register →
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Confirm Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-1 rounded-field font-display text-base tracking-[0.08em] btn-gold transition-all cursor-pointer"
                >
                  Reserve your seat
                </button>

                <p className="text-center text-xs text-base-content/40 mt-1">
                  Already have a seat?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-gold bg-transparent border-0 cursor-pointer p-0 font-inherit text-xs"
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
