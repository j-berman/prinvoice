import {
  getSqlRows,
} from '../../database/utils'
import { USERBASE_DATABASE_NAME } from '../../config'

const sql_invoice_subtotal = 'SUM(quantity * unit_price) AS subtotal'

const sql_invoice_tax = '(100 + tax_percent) / 100'
const sql_invoice_total = `SUM((subtotal - discount) * (${sql_invoice_tax}) + shipping) AS total`

export const getInvoices = (sqlJsDb) => {
  const sqlInvoiceSubtotals = `
    SELECT
      invoice.*,
      invoice_uuid,  
      ${sql_invoice_subtotal}
    FROM
      invoice
    INNER JOIN
      invoice_item ON invoice_item.invoice_uuid = invoice.uuid
    GROUP BY
      invoice_uuid
  `

  const sqlInvoiceTotals = `
    SELECT
      *,
      ${sql_invoice_total}
    FROM (${sqlInvoiceSubtotals})
    GROUP BY invoice_uuid
  `

  const sql = `
    SELECT
      invoice_with_total.*,
      agent.name AS customer
    FROM
      (${sqlInvoiceTotals}) AS invoice_with_total
    INNER JOIN
      agent ON agent.uuid = invoice_with_total.payor_uuid
    ORDER BY
      invoice_with_total.created_date DESC
  ;`

  return getSqlRows(sqlJsDb, sql)
}

export const getInvoiceItems = (sqlJsDb, invoiceUuid) => {
  const sql = `
    SELECT *
    FROM invoice_item
    WHERE invoice_uuid = "${invoiceUuid}"
    ORDER BY item_number ASC
  ;`
  return getSqlRows(sqlJsDb, sql)
}

export const getInvoiceObjectForExport = (invoice, invoiceItems) => {
  return {
    uuid: invoice.uuid,
    dateIssued: invoice.date_issued,
    dateDue: invoice.date_due,
    datePaid: invoice.date_paid,
    currency: invoice.currency,
    discount: invoice.discount,
    taxPercent: invoice.tax_percent,
    shipping: invoice.shipping,
    note: invoice.note,
    payor: {
      name: invoice.payor_name,
      email: invoice.payor_email,
      uuid: invoice.payor_uuid
    },
    payee: {
      name: invoice.payee_name,
      email: invoice.payee_email,
      uuid: invoice.payee_uuid
    },
    items: invoiceItems.map((item) => {
      return {
        itemNumber: item.item_number,
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: item.unit_price
      }
    })
  }
}

export const setDatePaid = async (invoiceUuid, datePaid) => {
  await window.userbase.execSql({
    databaseName: USERBASE_DATABASE_NAME,
    sql: `
      UPDATE invoice
      SET date_paid = $date_paid
      WHERE uuid = $uuid
    ;`,
    bindValues: {
      $date_paid: datePaid ? datePaid.toISOString() : null,
      $uuid: invoiceUuid
    }
  })
}

export const deleteInvoice = async (invoiceUuid) => {
  const deleteInvoiceItems = {
    sql: `
      DELETE FROM invoice_item
      WHERE invoice_uuid = $invoice_uuid
    ;`,
    bindValues: {
      $invoice_uuid: invoiceUuid
    }
  }

  const deleteInvoice = {
    sql: `
      DELETE FROM invoice
      WHERE uuid = $uuid
    ;`,
    bindValues: {
      $uuid: invoiceUuid
    }
  }

  await window.userbase.execSql({
    databaseName: USERBASE_DATABASE_NAME,
    sqlStatements: [
      deleteInvoiceItems,
      deleteInvoice
    ]
  })
}