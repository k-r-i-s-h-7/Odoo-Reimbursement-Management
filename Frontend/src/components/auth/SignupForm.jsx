import React, { useState } from 'react'

const inputClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/70'

const labelClassName = 'mb-1 block text-sm font-medium text-foreground'

const ErrorText = ({ message }) => <p className="mt-1 text-xs text-destructive">{message}</p>

const EyeIcon = ({ visible }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
    <circle cx="12" cy="12" r="3" />
    {visible ? null : <path d="M3 3l18 18" />}
  </svg>
)

const SignupForm = ({
  formData,
  errors,
  countries,
  isCountriesLoading,
  selectedCountry,
  usdRate,
  isRateLoading,
  onChange,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className={labelClassName}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={onChange}
          className={inputClassName}
          placeholder="John Carter"
          autoComplete="name"
        />
        {errors.name ? <ErrorText message={errors.name} /> : null}
      </div>

      <div>
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          className={inputClassName}
          placeholder="john@example.com"
          autoComplete="email"
        />
        {errors.email ? <ErrorText message={errors.email} /> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={onChange}
              className={`${inputClassName} pr-12`}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground transition hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {errors.password ? <ErrorText message={errors.password} /> : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClassName}>
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={onChange}
              className={`${inputClassName} pr-12`}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground transition hover:text-foreground"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              <EyeIcon visible={showConfirmPassword} />
            </button>
          </div>
          {errors.confirmPassword ? <ErrorText message={errors.confirmPassword} /> : null}
        </div>
      </div>

      <div>
        <label htmlFor="country" className={labelClassName}>
          Country
        </label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={onChange}
          className={inputClassName}
          disabled={isCountriesLoading}
        >
          <option value="">{isCountriesLoading ? 'Loading countries...' : 'Select your country'}</option>
          {countries.map((country) => (
            <option key={country.countryName} value={country.countryName}>
              {country.countryName} ({country.currencyCode})
            </option>
          ))}
        </select>
        {errors.country ? <ErrorText message={errors.country} /> : null}
      </div>

      {selectedCountry ? (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            Currency: {selectedCountry.currencyName} ({selectedCountry.currencyCode})
          </p>
          <p>
            {isRateLoading
              ? 'Fetching conversion to USD...'
              : usdRate
                ? `1 ${selectedCountry.currencyCode} = ${usdRate.toFixed(4)} USD`
                : 'Conversion rate currently unavailable.'}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition hover:cursor-pointer hover:opacity-90"
      >
        Sign Up
      </button>
    </form>
  )
}

export default SignupForm
