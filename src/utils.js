import React from 'react'
import { saveAs } from 'file-saver'

// https://github.com/bengourley/currency-symbol-map
export const currencySymbolMap = {
  'AED': 'د.إ',
  'AFN': '؋',
  'ALL': 'L',
  'AMD': '֏',
  'ANG': 'ƒ',
  'AOA': 'Kz',
  'ARS': '$',
  'AUD': '$',
  'AWG': 'ƒ',
  'AZN': '₼',
  'BAM': 'KM',
  'BBD': '$',
  'BDT': '৳',
  'BGN': 'лв',
  'BHD': '.د.ب',
  'BIF': 'FBu',
  'BMD': '$',
  'BND': '$',
  'BOB': '$b',
  'BRL': 'R$',
  'BSD': '$',
  'BTC': '฿',
  'BTN': 'Nu.',
  'BWP': 'P',
  'BYR': 'Br',
  'BYN': 'Br',
  'BZD': 'BZ$',
  'CAD': '$',
  'CDF': 'FC',
  'CHF': 'CHF',
  'CLP': '$',
  'CNY': '¥',
  'COP': '$',
  'CRC': '₡',
  'CUC': '$',
  'CUP': '₱',
  'CVE': '$',
  'CZK': 'Kč',
  'DJF': 'Fdj',
  'DKK': 'kr',
  'DOP': 'RD$',
  'DZD': 'دج',
  'EEK': 'kr',
  'EGP': '£',
  'ERN': 'Nfk',
  'ETB': 'Br',
  'ETH': 'Ξ',
  'EUR': '€',
  'FJD': '$',
  'FKP': '£',
  'GBP': '£',
  'GEL': '₾',
  'GGP': '£',
  'GHC': '₵',
  'GHS': 'GH₵',
  'GIP': '£',
  'GMD': 'D',
  'GNF': 'FG',
  'GTQ': 'Q',
  'GYD': '$',
  'HKD': '$',
  'HNL': 'L',
  'HRK': 'kn',
  'HTG': 'G',
  'HUF': 'Ft',
  'IDR': 'Rp',
  'ILS': '₪',
  'IMP': '£',
  'INR': '₹',
  'IQD': 'ع.د',
  'IRR': '﷼',
  'ISK': 'kr',
  'JEP': '£',
  'JMD': 'J$',
  'JOD': 'JD',
  'JPY': '¥',
  'KES': 'KSh',
  'KGS': 'лв',
  'KHR': '៛',
  'KMF': 'CF',
  'KPW': '₩',
  'KRW': '₩',
  'KWD': 'KD',
  'KYD': '$',
  'KZT': 'лв',
  'LAK': '₭',
  'LBP': '£',
  'LKR': '₨',
  'LRD': '$',
  'LSL': 'M',
  'LTC': 'Ł',
  'LTL': 'Lt',
  'LVL': 'Ls',
  'LYD': 'LD',
  'MAD': 'MAD',
  'MDL': 'lei',
  'MGA': 'Ar',
  'MKD': 'ден',
  'MMK': 'K',
  'MNT': '₮',
  'MOP': 'MOP$',
  'MRO': 'UM',
  'MRU': 'UM',
  'MUR': '₨',
  'MVR': 'Rf',
  'MWK': 'MK',
  'MXN': '$',
  'MYR': 'RM',
  'MZN': 'MT',
  'NAD': '$',
  'NGN': '₦',
  'NIO': 'C$',
  'NOK': 'kr',
  'NPR': '₨',
  'NZD': '$',
  'OMR': '﷼',
  'PAB': 'B/.',
  'PEN': 'S/.',
  'PGK': 'K',
  'PHP': '₱',
  'PKR': '₨',
  'PLN': 'zł',
  'PYG': 'Gs',
  'QAR': '﷼',
  'RMB': '￥',
  'RON': 'lei',
  'RSD': 'Дин.',
  'RUB': '₽',
  'RWF': 'R₣',
  'SAR': '﷼',
  'SBD': '$',
  'SCR': '₨',
  'SDG': 'ج.س.',
  'SEK': 'kr',
  'SGD': '$',
  'SHP': '£',
  'SLL': 'Le',
  'SOS': 'S',
  'SRD': '$',
  'SSP': '£',
  'STD': 'Db',
  'STN': 'Db',
  'SVC': '$',
  'SYP': '£',
  'SZL': 'E',
  'THB': '฿',
  'TJS': 'SM',
  'TMT': 'T',
  'TND': 'د.ت',
  'TOP': 'T$',
  'TRL': '₤',
  'TRY': '₺',
  'TTD': 'TT$',
  'TVD': '$',
  'TWD': 'NT$',
  'TZS': 'TSh',
  'UAH': '₴',
  'UGX': 'USh',
  'USD': '$',
  'UYU': '$U',
  'UZS': 'лв',
  'VEF': 'Bs',
  'VND': '₫',
  'VUV': 'VT',
  'WST': 'WS$',
  'XAF': 'FCFA',
  'XBT': 'Ƀ',
  'XCD': '$',
  'XOF': 'CFA',
  'XPF': '₣',
  'YER': '﷼',
  'ZAR': 'R',
  'ZWD': 'Z$'
}

// YYYY-MM-DD
export const toUniversalDateFormat = (date) => new Date(date).toLocaleDateString('fr-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

// YYYY-MM-DD
// [4 digits]-(either (0 and [1 through 9]), or (1 and [0 through 2]))-(either (0 and [1 through 9]), or ([1 or 2] and [0 through 9], or (3 and [0 through 1])))
export const dateFormatRegex = '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$'

// https://stackoverflow.com/questions/563406/add-days-to-javascript-date
export const addDaysToDate = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const numberToNumberString = (number, decimals = 2) => Number(number.toFixed(2)).toLocaleString(undefined, {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals
})

// https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
export const isValidDate = (date) => date instanceof Date && !isNaN(date)

// http://emailregex.com/
export const isValidEmail = (email) => /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)

export const getSpanWithTextHighlighted = (string, searchValue) => {
  if (!searchValue) return string

  const text = []
  let str = string

  while (str.length > 0) {
    const highlightIndex = str.toLowerCase().indexOf(searchValue.toLowerCase())

    if (highlightIndex !== -1) {
      text.push(<span key={Math.random()}>{str.substring(0, highlightIndex)}</span>)
      text.push(<span className='bold' key={Math.random()}>{str.substring(highlightIndex, highlightIndex + searchValue.length)}</span>)
      str = str.substring(highlightIndex + searchValue.length, str.length)
    } else {
      text.push(<span key={Math.random()}>{str.substring(0, str.length)}</span>)
      str = ''
    }
  }

  return text
}

const _getYearAndMonth = (date, monthsDiffFromMonthProvided) => {
  const year = date.getFullYear()
  const monthProvided = date.getMonth()
  const month = monthProvided + monthsDiffFromMonthProvided
  return { year, month }
}

const _getBeginningOfDay = (date) => {
  const hours = 0
  const mins = 0
  const secs = 0
  const ms = 0
  const newDate = new Date(date)
  newDate.setHours(hours, mins, secs, ms)
  return newDate
}

const _getEndOfDay = (date) => {
  const hours = 23
  const mins = 59
  const secs = 59
  const ms = 999
  const newDate = new Date(date)
  newDate.setHours(hours, mins, secs, ms)
  return newDate
}

export const getFirstDayOfMonth = (date, monthsDiffFromMonthProvided = 0) => {
  const { year, month } = _getYearAndMonth(date, monthsDiffFromMonthProvided)
  const firstDayOfMonth = 1
  const dateOfFirstDayOfMonth = new Date(year, month, firstDayOfMonth)
  return _getBeginningOfDay(dateOfFirstDayOfMonth)
}

// https://www.encodedna.com/javascript/first-and-last-day-of-a-given-month-in-javascript.htm
export const getLastDayOfMonth = (date, monthsDiffFromMonthProvided = 0) => {
  const { year, month } = _getYearAndMonth(date, monthsDiffFromMonthProvided)
  const theNextMonth = month + 1
  const oneDayBeforeTheNextMonth = 0 // i.e. last day of month desired
  const lastDayOfMonth = new Date(year, theNextMonth, oneDayBeforeTheNextMonth)
  return _getEndOfDay(lastDayOfMonth)
}

export const getMonthAsString = date => date.toLocaleString('en-us', { month: 'short' })

export const downloadFileLocally = (file) => {
  // workaround for Chrome iOS:
  // https://github.com/eligrey/FileSaver.js/issues/179
  if(!navigator.userAgent.match('CriOS')) {
    saveAs(file, file.name)
  } else {
    const reader = new FileReader()
    reader.onload = () => window.location.href = reader.result
    reader.readAsDataURL(file)
  }
}

/**
* Presents the file chooser to the user to pick a file to download.
* When the user chooses the file, the handleReceiveFile function
* is called with the file passed as the only argument. The
* handleReceiveFile enables a React component to do what it
* wants with the file.
*/
export const importFile = (fileExtension, handleImportedFile) => {
  const input = window.document.createElement('input')
  input.type = 'file'
  input.accept = fileExtension
  input.style.opacity = '0'
  input.onchange = (e) => {
    handleImportedFile(e.target.files[0])
    document.body.removeChild(input) // race condition prevents on change from firing on iOS
  }
  document.body.appendChild(input)
  input.click()
}

export const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = async (e) => resolve(e.target.result)
  reader.onerror = (e) => reject(e)
  reader.readAsArrayBuffer(file)
})

export const flatten = (array) => [].concat(...array)