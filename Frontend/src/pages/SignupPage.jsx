import React, { useEffect, useMemo, useState } from 'react'
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

    // Replace with backend signup API integration.
    alert(`Signup ready for ${formData.name}`)
    setFormData(initialValues)
    setErrors({})
    setUsdRate(null)
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_12%_15%,var(--color-accent)/0.30,transparent_38%),radial-gradient(circle_at_88%_78%,var(--color-primary)/0.20,transparent_34%)]" />

      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.35fr_0.9fr]">
        <aside className="overflow-hidden">
          <img
            src="/signup.png"
            alt="Admin signup"
            className="h-[14rem] w-full object-contain object-center sm:h-[18rem] lg:h-[32rem]"
          />
        </aside>

        <div className="rounded-2xl bg-card p-5 shadow-xl sm:p-7">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
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
        </div>
      </section>
    </main>
  )
}

export default SignupPage
