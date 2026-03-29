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
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleSubmit = async (event) => {
    event.preventDefault()

    // 1. Client-side Validation
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

    setIsSubmitting(true)
    setErrors({})

    try {
      // 2. API Call
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Displays "Invalid credentials" or other backend errors
        setErrors({ submit: data.error || data.message || 'Failed to sign in.' })
        return
      }

      // 3. Storage Logic
      // Store JWT Tokens
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)

      // Store Company Name (from Prisma include: { company: true })
      if (data.company && data.company.name) {
        localStorage.setItem('companyName', data.company.name)
      }

      // 4. Role-Based Navigation
      // Extracts role name whether it's a string or a Prisma object
      const roleValue = typeof data.role === 'object' ? data.role.name : data.role
      const normalizedRole = (roleValue || "").toLowerCase()

      if (normalizedRole === 'admin') {
        setErrors({})
        navigate('/admin/dashboard')
      } else {
        // If user is not an admin, redirect to a standard user page 
        // or show an error if they shouldn't be here.
        navigate('/dashboard')
      }

    } catch (error) {
      console.error('Login error:', error)
      setErrors({ submit: 'A network error occurred. Please try again later.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative h-screen overflow-hidden bg-background">
      {/* Background Decorative Gradients */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_16%_18%,var(--color-accent)/0.30,transparent_38%),radial-gradient(circle_at_84%_82%,var(--color-primary)/0.20,transparent_34%)]" />

      <section className="relative grid h-full w-full items-stretch gap-0 lg:grid-cols-2">
        {/* Visual Sidebar */}
        <aside className="relative hidden overflow-hidden bg-linear-to-br from-violet-600 via-fuchsia-600 to-purple-700 px-5 py-6 sm:px-7 sm:py-7 lg:block">
          <div className="pointer-events-none absolute inset-0 opacity-18 bg-[linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-size-[28px_28px]" />
          <img
            src="/login.png"
            alt="Sign in"
            className="relative h-full w-full object-contain object-center drop-shadow-2xl"
            onError={(event) => {
              event.currentTarget.src = '/signup.png'
            }}
          />
        </aside>

        {/* Form Container */}
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

          {/* Backend/Submit Error Message */}
          {errors.submit && (
            <div className="mb-4 rounded border border-red-500 bg-red-50 p-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          <SigninForm 
            formData={formData} 
            errors={errors} 
            onChange={handleChange} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting} 
          />

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" size="sm" className="font-medium text-primary hover:underline">
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