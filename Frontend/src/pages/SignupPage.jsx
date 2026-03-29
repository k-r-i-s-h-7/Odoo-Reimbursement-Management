import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SignupForm from '../components/auth/SignupForm'
import { getCountriesWithCurrency, getUsdRateForCurrency } from '../services/countryCurrencyService'
import { apiFetch } from '../services/apiClient'
import { validateSignupForm } from '../utils/signupFormValidation'

// 1. Added companyName to match backend requirements
const initialValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '', 
  country: '',
}

const SignupPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [countries, setCountries] = useState([])
  const [isCountriesLoading, setIsCountriesLoading] = useState(true)
  const [usdRate, setUsdRate] = useState(null)
  const [isRateLoading, setIsRateLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Added submitting state

  useEffect(() => {
    let active = true

    const loadCountries = async () => {
      try {
        const list = await getCountriesWithCurrency()
        if (active) {
          setCountries(list)
        }
      } catch {
        if (active) {
          setCountries([])
        }
      } finally {
        if (active) {
          setIsCountriesLoading(false)
        }
      }
    }

    loadCountries()

    return () => {
      active = false
    }
  }, [])

  const selectedCountry = useMemo(
    () => countries.find((item) => item.countryName === formData.country) ?? null,
    [countries, formData.country],
  )

  useEffect(() => {
    let active = true

    const loadRate = async () => {
      if (!selectedCountry?.currencyCode) {
        setUsdRate(null)
        return
      }

      setIsRateLoading(true)
      try {
        const rate = await getUsdRateForCurrency(selectedCountry.currencyCode)
        if (active) {
          setUsdRate(rate)
        }
      } catch {
        if (active) {
          setUsdRate(null)
        }
      } finally {
        if (active) {
          setIsRateLoading(false)
        }
      }
    }

    loadRate()

    return () => {
      active = false
    }
  }, [selectedCountry])

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

  // 2. Updated handleSubmit to call backend API
  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateSignupForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({}) // Clear previous generic errors

    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName || formData.name,
          country: formData.country,
          currency: selectedCountry?.currencyCode || 'USD',
        }),
      })

      // 3. Store the generated JWT tokens
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)

      setFormData(initialValues)
      setErrors({})
      setUsdRate(null)
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ submit: error.message || 'A network error occurred. Please try again later.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_12%_15%,var(--color-accent)/0.30,transparent_38%),radial-gradient(circle_at_88%_78%,var(--color-primary)/0.20,transparent_34%)]" />

      <section className="relative grid h-full w-full items-stretch gap-0 lg:grid-cols-2">
        <aside className="relative overflow-hidden bg-linear-to-br from-violet-600 via-fuchsia-600 to-purple-700 px-5 py-6 sm:px-7 sm:py-7 lg:h-full">
          <div className="pointer-events-none absolute inset-0 opacity-18 bg-[linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-size-[28px_28px]" />
          <img
            src="/signup.png"
            alt="Admin signup"
            className="relative h-full w-full object-contain object-center drop-shadow-2xl"
          />
        </aside>

        <div className="relative flex h-full flex-col justify-center bg-card px-5 py-4 sm:px-7 sm:py-5 lg:px-9">
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-border lg:block" />
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary">
              Admin Portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Manage reimbursements with location-aware currency details and a secure admin-only signup flow.
            </p>
          </div>

          {/* Render backend errors if they exist */}
          {errors.submit && (
            <div className="mb-4 rounded border border-red-500 bg-red-50 p-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          <SignupForm
            formData={formData}
            errors={errors}
            countries={countries}
            isCountriesLoading={isCountriesLoading}
            selectedCountry={selectedCountry}
            usdRate={usdRate}
            isRateLoading={isRateLoading}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting} // Passed down to disable button
          />

          <p className="mt-4 text-sm text-muted-foreground">
            Already have account?{' '}
            <Link to="/signin" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default SignupPage