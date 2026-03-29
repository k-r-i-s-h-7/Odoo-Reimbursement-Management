import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SigninForm from '../components/auth/SigninForm'

const initialValues = {
  email: '',
  password: '',
}

const SigninPage = () => {
  const [formData, setFormData] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    alert(`Welcome back, ${formData.email}`)
    setErrors({})
    navigate('/admin/dashboard')
  }

  return (
    <main className="relative h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_16%_18%,var(--color-accent)/0.30,transparent_38%),radial-gradient(circle_at_84%_82%,var(--color-primary)/0.20,transparent_34%)]" />

      <section className="relative grid h-full w-full items-stretch gap-0 lg:grid-cols-2">
        <aside className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-700 px-5 py-6 sm:px-7 sm:py-7 lg:h-full">
          <div className="pointer-events-none absolute inset-0 opacity-18 [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
          <img
            src="/login.png"
            alt="Sign in"
            className="relative h-full w-full object-contain object-center drop-shadow-2xl"
            onError={(event) => {
              event.currentTarget.src = '/signup.png'
            }}
          />
        </aside>

        <div className="relative flex h-full flex-col justify-center bg-card px-5 py-4 sm:px-7 sm:py-5 lg:px-9">
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-border lg:block" />
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary">Welcome Back</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground sm:text-4xl">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Access your reimbursement dashboard with your account credentials.
            </p>
          </div>

          <SigninForm formData={formData} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              Forgot password?
            </Link>
            <p className="text-muted-foreground">
              Don&apos;t have account?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default SigninPage
