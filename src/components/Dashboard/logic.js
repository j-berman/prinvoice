import {
  getSqlRows,
} from '../../database/utils'
import {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getMonthAsString,
} from '../../utils'
import { DEFAULT_CURRENCY } from '../../config'

const DISPLAY_NUM_MONTHS = 3
const DISPLAY_NUM_RANKS = 5

export const getCurrency = (sqlJsDb, userId) => {
  const sql = `SELECT currency FROM user WHERE uuid = "${userId}"`
  const currencyRow = getSqlRows(sqlJsDb, sql)

  return currencyRow.length
    ? currencyRow[0].currency
    : DEFAULT_CURRENCY
}

export const hasCreatedInvoice = (sqlJsDb) => {
  const sql = `SELECT * FROM invoice LIMIT 1;`
  return getSqlRows(sqlJsDb, sql).length > 0
}

const sql_item_amount = 'quantity * unit_price'
const sql_invoice_subtotal = `SUM(${sql_item_amount}) AS subtotal`
const sql_invoice_total_excluding_tax = 'SUM(subtotal - discount + shipping) AS invoice_total_excluding_tax'

const sql_invoice_tax = '(100 + tax_percent) / 100'
const sql_invoice_total = `SUM((subtotal - discount) * (${sql_invoice_tax}) + shipping) AS invoice_total`

const _getSalesForMonth = (sqlJsDb, start, end, currency) => {
  const sqlInvoiceSubtotalsForMonth = `
    SELECT
      ${sql_invoice_subtotal},
      invoice_uuid,
      discount,
      shipping
    FROM
      invoice
    INNER JOIN
      invoice_item ON invoice_item.invoice_uuid = invoice.uuid
    WHERE
      invoice.date_issued BETWEEN "${start.toISOString()}" AND "${end.toISOString()}" AND 
      invoice.currency = "${currency}"
    GROUP BY
      invoice_uuid
  `

  const sqlInvoiceTotalsForMonth = `
    SELECT ${sql_invoice_total_excluding_tax}
    FROM (${sqlInvoiceSubtotalsForMonth})
    GROUP BY invoice_uuid
  `

  const sql = `
    SELECT SUM(invoice_total_excluding_tax) AS sales
    FROM (${sqlInvoiceTotalsForMonth});
  `

  return getSqlRows(sqlJsDb, sql)
}

export const getMonthlySales = (sqlJsDb, currency, lastNMonths = DISPLAY_NUM_MONTHS) => {
  const currentDate = new Date()

  const sales = []
  const months = []

  for (let i = 1; i <= lastNMonths; i++) {
    const start = getFirstDayOfMonth(currentDate, (lastNMonths - i) * -1)
    const end = getLastDayOfMonth(currentDate, (lastNMonths - i) * -1)

    sales.push(_getSalesForMonth(sqlJsDb, start, end, currency)[0].sales)
    months.push(getMonthAsString(start))
  }

  return { sales, months }
}

export const getSalesByCustomer = (sqlJsDb, currency) => {
  const sqlInvoiceSubtotals = `
    SELECT
      ${sql_invoice_subtotal},
      invoice_uuid,
      payor_uuid,
      discount,
      shipping
    FROM
      invoice
    INNER JOIN
      invoice_item ON invoice_item.invoice_uuid = invoice.uuid
    WHERE
      invoice.currency = "${currency}"
    GROUP BY
      invoice_uuid
  `

  const sqlInvoiceTotals = `
    SELECT
      payor_uuid,
      ${sql_invoice_total_excluding_tax}
    FROM (${sqlInvoiceSubtotals})
    GROUP BY invoice_uuid
  `

  const sqlSalesByCustomer = `
    SELECT
      agent.name AS customer,
      SUM(invoice_total_excluding_tax) AS sales
    FROM (${sqlInvoiceTotals})
    INNER JOIN agent ON agent.uuid = payor_uuid
    GROUP BY payor_uuid
    ORDER BY sales DESC
  `

  const sqlRanks = `
    SELECT
      *,
      RANK() OVER (ORDER BY sales DESC) AS rank
    FROM (${sqlSalesByCustomer})  
  `

  const sqlTopCustomers = `
    SELECT *
    FROM (${sqlRanks})
    WHERE rank <= ${DISPLAY_NUM_RANKS}
  ;`

  const sqlOtherCustomers = `
    SELECT
      "Others" AS customer,     
      SUM(sales) AS sales
    FROM (${sqlRanks})
    WHERE rank > ${DISPLAY_NUM_RANKS}
  ;`

  const resultTopCustomers = getSqlRows(sqlJsDb, sqlTopCustomers)
  const resultOtherCustomers = getSqlRows(sqlJsDb, sqlOtherCustomers)
  const result = resultOtherCustomers[0].sales
    ? resultTopCustomers.concat(resultOtherCustomers)
    : resultTopCustomers

  const sales = result.map(r => r.sales)
  const customers = result.map(r => r.customer)

  return { sales, customers }
}

export const getSalesByProduct = (sqlJsDb, currency) => {
  const sqlInvoiceItemAmounts = `
    SELECT
      (${sql_item_amount}) AS item_amount,
      resource_uuid
    FROM
      invoice
    INNER JOIN
      invoice_item ON invoice_item.invoice_uuid = invoice.uuid
    WHERE
      invoice.currency = "${currency}"
  `

  const sqlSalesByProduct = `
    SELECT
      resource.name AS product,
      SUM(item_amount) AS sales
    FROM (${sqlInvoiceItemAmounts})
    INNER JOIN resource ON resource.uuid = resource_uuid
    GROUP BY resource_uuid
    ORDER BY sales DESC
  `

  const sqlRanks = `
    SELECT
      *,
      RANK() OVER (ORDER BY sales DESC) AS rank
    FROM (${sqlSalesByProduct})  
  `

  const sqlTopProducts = `
    SELECT *
    FROM (${sqlRanks})
    WHERE rank <= ${DISPLAY_NUM_RANKS}
  ;`

  const sqlOtherProducts = `
    SELECT
      "Others" AS product,     
      SUM(sales) AS sales
    FROM (${sqlRanks})
    WHERE rank > ${DISPLAY_NUM_RANKS}
  ;`

  const resultTopProducts = getSqlRows(sqlJsDb, sqlTopProducts)
  const resultOtherProducts = getSqlRows(sqlJsDb, sqlOtherProducts)
  const result = resultOtherProducts[0].sales
    ? resultTopProducts.concat(resultOtherProducts)
    : resultTopProducts

  const sales = result.map(r => r.sales)
  const products = result.map(r => r.product)

  return { sales, products }
}

export const getTotals = (sqlJsDb, currency) => {
  const sqlInvoiceSubtotals = `
    SELECT    
      invoice_uuid,
      date_due,
      date_paid,
      discount,
      tax_percent,
      shipping,
      ${sql_invoice_subtotal}
    FROM
      invoice
    INNER JOIN
      invoice_item ON invoice_item.invoice_uuid = invoice.uuid
    WHERE
      invoice.currency = "${currency}"
    GROUP BY
      invoice_uuid
  `

  const sqlInvoiceTotals = `
    SELECT
      date_due,
      date_paid,      
      ${sql_invoice_total}
    FROM (${sqlInvoiceSubtotals})
    GROUP BY invoice_uuid
  `

  const dateToday = new Date().toISOString()
  const sql = `
    SELECT
      SUM(invoice_total) AS total,
      SUM(
        CASE
          WHEN date_paid IS NOT NULL
          THEN invoice_total
          ELSE 0
        END
      ) AS received,
      SUM(
        CASE
          WHEN date_paid IS NULL
          THEN invoice_total
          ELSE 0
        END
      ) AS owed,
      SUM(
        CASE
          WHEN 
            date_paid IS NULL AND
            date_due IS NOT NULL AND
            date_due < "${dateToday}"
          THEN invoice_total
          ELSE 0
        END
      ) AS overdue
    FROM (${sqlInvoiceTotals})
  ;`

  const result = getSqlRows(sqlJsDb, sql)
  return result[0]
}

export const getCustomerCount = (sqlJsDb) => {
  const sql = `
    SELECT COUNT(DISTINCT agent.uuid) AS count
    FROM agent
    INNER JOIN invoice ON invoice.payor_uuid = agent.uuid
  ;`

  const result = getSqlRows(sqlJsDb, sql)
  return result[0].count
}