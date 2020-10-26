import {
  getSqlRows,
} from '../../database/utils'

const sql_invoice_subtotal = (userId) =>  `
  SUM(
    CASE 
      WHEN invoice.currency = (SELECT currency FROM user WHERE uuid = "${userId}")
      THEN (quantity * unit_price)
      ELSE 0
    END
  ) AS subtotal
`

const sql_invoice_tax = '(100 + tax_percent) / 100'
const sql_invoice_total = (userId) => `
  SUM(
    CASE
      WHEN currency = (SELECT currency FROM user WHERE uuid = "${userId}")
      THEN ((subtotal - discount) * (${sql_invoice_tax}) + shipping)
      ELSE 0
    END
  ) AS total
`

export const getCustomers = (sqlJsDb, userId) => {
  const sqlInvoiceSubtotals = `
    SELECT    
      invoice_uuid,
      payor_uuid,
      date_paid,
      discount,
      tax_percent,
      shipping,
      currency,
      ${sql_invoice_subtotal(userId)}
    FROM
      invoice
    INNER JOIN
      invoice_item ON invoice_item.invoice_uuid = invoice.uuid
    GROUP BY
      invoice_uuid
  `

  const sqlInvoiceTotals = `
    SELECT
      payor_uuid,
      date_paid,
      ${sql_invoice_total(userId)}
    FROM (${sqlInvoiceSubtotals})
    GROUP BY invoice_uuid
  `

  const sql = `
    SELECT
      agent.name AS customer,
      agent.email,
      (SELECT currency FROM user WHERE uuid = "${userId}") AS currency,
      SUM(
        CASE
          WHEN date_paid IS NOT NULL
          THEN total
          ELSE 0
        END
      ) AS amount_received,
      SUM(
        CASE
          WHEN date_paid IS NULL
          THEN total
          ELSE 0
        END
      ) AS amount_owes
    FROM (${sqlInvoiceTotals})
    INNER JOIN agent ON agent.uuid = payor_uuid
    GROUP BY payor_uuid
    ORDER BY LOWER(customer) ASC
  `

  return getSqlRows(sqlJsDb, sql)
}