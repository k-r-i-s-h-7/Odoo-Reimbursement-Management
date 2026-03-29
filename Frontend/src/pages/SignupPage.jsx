import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SignupForm from '../components/auth/SignupForm'
import { getCountriesWithCurrency, getUsdRateForCurrency } from '../services/countryCurrencyService'
import { validateSignupForm } from '../utils/signupFormValidation'

const initialValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
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

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = validateSignupForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setFormData(initialValues)
    setErrors({})
    setUsdRate(null)
    navigate('/admin/dashboard')
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
