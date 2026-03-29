import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setMessage('Please enter your email first.')
      return
    }

    setMessage(`Password reset link sent to ${email}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary">Admin Portal</p>
        <h1 className="mt-2 text-2xl font-semibold text-card-foreground">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we will send a password reset link.
        </p>

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
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/70"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition hover:cursor-pointer hover:opacity-90"
          >
            Send reset link
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-primary">{message}</p> : null}

        <div className="mt-4 flex items-center justify-between text-sm">
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
