const COUNTRY_API_URL = 'https://restcountries.com/v3.1/all?fields=name,currencies'
const RATE_API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest'

const mapCountry = (country) => {
  const currencyEntry = Object.entries(country.currencies ?? {})[0]
  const [code, details] = currencyEntry ?? []

  return {
    countryName: country.name?.common ?? '',
    currencyCode: code ?? '',
    currencyName: details?.name ?? '',
  }
}

export const getCountriesWithCurrency = async () => {
  const response = await fetch(COUNTRY_API_URL)

  if (!response.ok) {
    throw new Error('Failed to load countries')
  }

  const data = await response.json()

  return data
    .map(mapCountry)
    .filter((item) => item.countryName && item.currencyCode)
    .sort((a, b) => a.countryName.localeCompare(b.countryName))
}

export const getUsdRateForCurrency = async (baseCurrency) => {
  const response = await fetch(`${RATE_API_BASE_URL}/${baseCurrency}`)

  if (!response.ok) {
    throw new Error('Failed to load exchange rates')
  }

  const data = await response.json()
  return data?.rates?.USD ?? null
}
