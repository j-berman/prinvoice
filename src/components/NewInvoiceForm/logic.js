import { v4 as uuidv4 } from 'uuid'
import BigNumber from 'bignumber.js'
import { USERBASE_DATABASE_NAME, DEFAULT_CURRENCY } from '../../config'
import {
  addDaysToDate,
  isValidDate,
  isValidEmail,
  currencySymbolMap,
  numberToNumberString,
  downloadFileLocally,
} from '../../utils'
import {
  setCreatedDateOnSqlStatements,
  getSqlRows,
} from '../../database/utils'

class DetailedErrors extends Error {
  constructor(errors, errorMap) {
    super()
    this.errors = errors
    this.errorMap = errorMap
  }
}

export const newEmptyInvoice = (sqlJsDb, user) => {
  const userDefaults = { ...getUserDefaults(sqlJsDb, user.userId) }
  const { name, currency } = userDefaults

  return {
    uuid: uuidv4(),
    dateIssued: new Date(),
    dateDue: addDaysToDate(new Date(), 28),
    items: [newEmptyInvoiceItem()],
    payor: { uuid: uuidv4() },
    payee: { ...user, name: name || '' },
    currency: currency || DEFAULT_CURRENCY,
    discount: 0,
    taxPercent: 0,
    shipping: 0,
    note: '',
  }
}

export const newEmptyInvoiceItem = () => ({
  resourceUuid: uuidv4(),
  name: '',
  quantity: 1,
  unitPrice: 0
})

export const getItemAmount = (item) => {
  return (item.quantity <= 0 || item.unitPrice <= 0 || isNaN(Number(item.quantity)) || isNaN(Number(item.unitPrice)))
    ? new BigNumber(0)
    : new BigNumber(item.quantity).multipliedBy(new BigNumber(item.unitPrice))
}

export const getSubtotal = (items) => {
  let subtotal = new BigNumber(0)
  for (let i = 0; i < items.length; i++) {
    const itemAmount = getItemAmount(items[i])
    if (itemAmount.isPositive()) subtotal = subtotal.plus(itemAmount)
  }
  return subtotal
}

export const getSubtotalAfterDiscount = (subtotal, discount) => {
  const discountBigNumber = (discount > 0 && !isNaN(Number(discount)))
    ? new BigNumber(discount)
    : new BigNumber(0)

  const afterDiscount = subtotal.minus(discountBigNumber)
  return afterDiscount.isNegative()
    ? new BigNumber(0)
    : afterDiscount
}

export const getTax = (taxPercent, subtotalAfterDiscount) => {
  if (taxPercent <= 0 || isNaN(Number(taxPercent))) {
    return new BigNumber(0)
  } else {
    const taxPercentBigNumber = new BigNumber(taxPercent).dividedBy(100)
    return subtotalAfterDiscount.multipliedBy(taxPercentBigNumber)
  }
}

export const getTotal = (subtotalAfterDiscount, tax, shipping) => {
  const shippingBigNumber = (shipping > 0 && !isNaN(Number(shipping)))
    ? new BigNumber(shipping)
    : new BigNumber(0)

  return subtotalAfterDiscount.plus(tax).plus(shippingBigNumber)
}

const _validateInvoiceItems = (items, errors, errorMap) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const { resourceUuid, name, quantity, unitPrice } = item

    errorMap.items[resourceUuid] = {}

    const itemNumber = i + 1
    if (!name) {
      errors.push(`Item ${itemNumber} is missing an Item name.`)
      errorMap.items[resourceUuid].name = true
    }

    if (!quantity && quantity !== 0) {
      errors.push(`Item ${itemNumber} is missing a Quantity.`)
      errorMap.items[resourceUuid].quantity = true
    } else if (quantity <= 0) {
      errors.push(`Item ${itemNumber} has Quantity less than or equal to 0. Please include a positive quantity.`)
      errorMap.items[resourceUuid].quantity = true
    }

    if (!unitPrice && unitPrice !== 0) {
      errors.push(`Item ${itemNumber} is missing a Price.`)
      errorMap.items[resourceUuid].unitPrice = true
    }

    if (unitPrice < 0) {
      errors.push(`Item ${itemNumber} has Price less than 0. Please include a price greater than or equal to 0.`)
      errorMap.items[resourceUuid].unitPrice = true
    }
  }
}

export const validateInvoice = (invoice) => {
  const errors = []
  const errorMap = { payee: {}, payor: {}, items: {} }

  const {
    payee,
    payor,
    dateIssued,
    dateDue,
    items,
    discount,
    taxPercent,
    shipping,
  } = invoice

  if (!payee.name) {
    errors.push('Your name is missing. Please include your name.')
    errorMap.payee.name = true
  }

  if (!payor.name) {
    errors.push('BILL TO name is missing. Please include a name to bill.')
    errorMap.payor.name = true
  }

  if (payor.email && !isValidEmail(payor.email)) {
    errors.push('BILL TO email is invalid. Please enter a valid email address.')
    errorMap.payor.email = true
  }

  if (!isValidDate(new Date(dateIssued))) {
    errors.push('Invalid date issued. Please make sure the date is valid and has format YYYY-MM-DD.')
    errorMap.dateIssued = true
  }

  if (dateDue && !isValidDate(new Date(dateDue))) {
    errors.push('Invalid date due. Please make sure the date is valid and has format YYYY-MM-DD.')
    errorMap.dateDue = true
  }

  _validateInvoiceItems(items, errors, errorMap)

  if (discount < 0) {
    errors.push(`Discount provided is less than 0. Please include a discount greater than or equal to 0.`)
    errorMap.discount = true
  }

  if (taxPercent < 0) {
    errors.push(`Tax provided is less than 0. Please include a tax greater than or equal to 0.`)
    errorMap.taxPercent = true
  }

  if (shipping < 0) {
    errors.push(`Shipping cost provided is less than 0. Please include a shipping cost greater than or equal to 0.`)
    errorMap.shipping = true
  }

  if (errors.length) throw new DetailedErrors(errors, errorMap)
}

export const emailInvoiceLink = (invoice) => {
  const {
    payee,
    payor,
    dateDue,
    currency,
    items,
    discount,
    taxPercent,
    shipping,
    note,
  } = invoice

  const subtotal = getSubtotal(items)
  const subtotalAfterDiscount = getSubtotalAfterDiscount(subtotal, discount)
  const tax = getTax(taxPercent, subtotalAfterDiscount)
  const total = currencySymbolMap[currency] + numberToNumberString(getTotal(subtotalAfterDiscount, tax, shipping))

  const dueDate = isValidDate(new Date(dateDue))
    ? (' due ' + new Date(dateDue).toLocaleDateString())
    : ''

  let lineItems = ''
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const { name, quantity, unitPrice } = item

    if (quantity < 0 || unitPrice < 0 || isNaN(Number(quantity)) || isNaN(Number(unitPrice))) continue

    lineItems += `${name} (${quantity} x ${currencySymbolMap[currency]}${numberToNumberString(Number(unitPrice))})\n`
  }

  const subject = encodeURIComponent(`Invoice from ${payee.name || ''} for ${total}`)
  const body = encodeURIComponent(`Hi ${payor.name || ''},\n`
      + '\n'
      + `Here is an invoice for ${total}${dueDate}.\n`
      + '\n'
      + lineItems
      + '\n'
      + (note || 'Thank you!') + '\n'
      + '\n'
      + `${payee.name || ''}`)

  return `mailto:${payor.email || ''}?subject=${subject}&body=${body}`
}

export const downloadInvoicePdf = async (invoice) => {
  // lazy load InvoicePdf because @react-pdf is very large
  const InvoicePdf = (await import('./InvoicePdf')).default

  const pdfObject = InvoicePdf({ invoice })
  const pdfBlob = await pdfObject.toBlob()

  const { payor, dateIssued } = invoice
  const issuedDate = isValidDate(new Date(dateIssued))
    ? (`-${new Date(dateIssued).toLocaleDateString()}`)
    : ''

  const pdfFilename = `Invoice-${payor.name || ''}${issuedDate}.pdf`

  const pdf = new File([pdfBlob], pdfFilename, { type: 'application/pdf' })

  downloadFileLocally(pdf)
}

export const getUserDefaults = (sqlJsDb, userId) => {
  const sql = `
    SELECT *
    FROM user
    WHERE uuid = '${userId}';
  `

  const userDefaults = getSqlRows(sqlJsDb, sql)

  if (userDefaults.length) return userDefaults[0]
  else return {}
}

export const getCustomers = (sqlJsDb) => {
  const sql = `
    SELECT *
    FROM agent;
  `

  return getSqlRows(sqlJsDb, sql)
}

export const getProducts = (sqlJsDb) => {
  const sql = `
    SELECT *
    FROM resource;
  `

 return getSqlRows(sqlJsDb, sql)
}

const _insertInvoice = (invoice) => {
  const {
    uuid,
    payee,
    payor,
    currency,
    dateIssued,
    dateDue,
    discount,
    taxPercent,
    shipping,
    note,
  } = invoice

  const payorUuid = `
    SELECT uuid
    FROM agent
    WHERE name = $payor_name COLLATE NOCASE
  `

  return {
    sql:`
      INSERT INTO invoice (
        uuid,
        date_issued, date_paid, date_due,
        currency, discount, tax_percent, shipping, note,
        payee_uuid, payee_name, payee_email,
        payor_uuid, payor_name, payor_email,
        created_date
      )
      VALUES (
        $uuid, $date_issued, $date_paid, $date_due,
        $currency, $discount, $tax_percent, $shipping, $note,
        $payee_uuid, $payee_name, $payee_email,
        (${payorUuid}), $payor_name, $payor_email,
        $created_date
      );
    `,
    bindValues: {
      $uuid: uuid,
      $date_issued: new Date(dateIssued).toISOString(),
      $date_due: dateDue ? new Date(dateDue).toISOString() : null,
      $currency: currency,
      $discount: discount,
      $tax_percent: taxPercent,
      $shipping: shipping,
      $note: note,
      $payee_uuid: payee.userId,
      $payee_name: payee.name,
      $payee_email: payee.email,
      $payor_name: payor.name,
      $payor_email: payor.email
    }
  }
}

const _insertItem = (invoiceUuid, item, itemNumber) => {
  const { name, unitPrice, quantity } = item

  const resourceUuid = `
    SELECT uuid
    FROM resource
    WHERE name = $item_name COLLATE NOCASE
  `
  return {
    sql: `
      INSERT INTO invoice_item (invoice_uuid, item_number, item_name, quantity, unit_price, created_date, resource_uuid)
      VALUES ($invoice_uuid, $item_number, $item_name, $quantity, $unit_price, $created_date, (${resourceUuid}));
    `,
    bindValues: {
      $invoice_uuid: invoiceUuid,
      $item_number: itemNumber,
      $item_name: name,
      $unit_price: unitPrice,
      $quantity: quantity,
    }
  }
}

const _upsertResource = (item) => {
  const { resourceUuid, name, unitPrice } = item
  return {
    sql: `
      INSERT INTO resource (uuid, name, unit_price, created_date)
      VALUES ($uuid, $name, $unit_price, $created_date)
      ON CONFLICT DO NOTHING;
    `,
    bindValues: {
      $uuid: resourceUuid,
      $name: name,
      $unit_price: unitPrice,
    }
  }
}

const _upsertPayor = (payor) => {
  return {
    sql: `
      INSERT INTO agent (uuid, name, email, created_date)
      VALUES ($uuid, $name, $email, $created_date)
      ON CONFLICT DO NOTHING;
    `,
    bindValues: {
      $uuid: payor.uuid,
      $name: payor.name,
      $email: payor.email
    }
  }
}

const _upsertUserDefaultSettings = (payee, currency) => {
  return {
    sql: `
      INSERT INTO user (uuid, name, currency, created_date)
      VALUES ($uuid, $name, $currency, $created_date)
      ON CONFLICT(uuid) DO NOTHING;
    `,
    bindValues: {
      $uuid: payee.userId,
      $name: payee.name,
      $currency: currency
    }
  }
}

export const createInvoice = async (invoice) => {
  const upsertUserDefaults = _upsertUserDefaultSettings(invoice.payee, invoice.currency)
  const upsertPayor = _upsertPayor(invoice.payor)
  const upsertResources = invoice.items.map(item => _upsertResource(item))
  const insertItems = invoice.items.map((item, i) => _insertItem(invoice.uuid, item, i))
  const insertInvoice = _insertInvoice(invoice)

  const sqlStatements = setCreatedDateOnSqlStatements([
    upsertUserDefaults,
    upsertPayor,
    ...upsertResources,
    ...insertItems,
    insertInvoice,
  ])

  await window.userbase.execSql({ databaseName: USERBASE_DATABASE_NAME, sqlStatements })
}
