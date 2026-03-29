import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter your email address.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setMessage(data.error || data.message || 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      setMessage(data.message || 'If that email is registered, a temporary password has been sent.')
    } catch {
      setStatus('error')
      setMessage('A network error occurred. Please check your connection and try again.')
    }
  }

  const isLoading = status === 'loading'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary">Admin Portal</p>
        <h1 className="mt-2 text-2xl font-semibold text-card-foreground">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we will send you a temporary password to log in with.
        </p>

        {status !== 'success' && (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="forgotEmail" className="mb-1 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="forgotEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/70 disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>

            {status === 'error' && (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition hover:cursor-pointer hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending…
                </span>
              ) : (
                'Send temporary password'
              )}
            </button>
          </form>
        )}

        {status === 'success' && (
          <div className="mt-5 rounded-md border border-green-300 bg-green-50 px-4 py-4 text-sm text-green-700">
            <p className="font-semibold">Check your inbox!</p>
            <p className="mt-1">{message}</p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link to="/signin" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create account
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
