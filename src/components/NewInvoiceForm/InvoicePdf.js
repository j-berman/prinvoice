import React from 'react'
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer'
import {
  isValidDate,
  numberToNumberString,
  currencySymbolMap
} from '../../utils'
import {
  getSubtotal,
  getSubtotalAfterDiscount,
  getTax,
  getTotal,
  getItemAmount
} from './logic'

const medFontSize = 14
const largeFontSize = 16

const COLUMN_1_WIDTH = 45
const COLUMN_2_WIDTH = 16
const COLUMN_3_WIDTH = 17
const COLUMN_4_WIDTH = 22

const COLUMN_1_WIDTH_PERCENT = `${COLUMN_1_WIDTH}%`
const COLUMN_2_WIDTH_PERCENT = `${COLUMN_2_WIDTH}%`
const COLUMN_3_WIDTH_PERCENT = `${COLUMN_3_WIDTH}%`
const COLUMN_4_WIDTH_PERCENT = `${COLUMN_4_WIDTH}%`

const TEXT_PADDING = 3

const InvoicePdf = (props) => {
  const { invoice } = props
  const {
    uuid,
    payee,
    payor,
    currency,
    items,
    discount,
    taxPercent,
    shipping,
    note,
  } = invoice

  const dateIssued = invoice.dateIssued && isValidDate(new Date(invoice.dateIssued))
    ? new Date(invoice.dateIssued).toLocaleDateString()
    : ''

  const dateDue = invoice.dateDue && isValidDate(new Date(invoice.dateDue))
    ? new Date(invoice.dateDue).toLocaleDateString()
    : ''

  const datePaid = invoice.datePaid && isValidDate(new Date(invoice.datePaid))
    ? new Date(invoice.datePaid).toLocaleDateString()
    : false

  const subtotal = getSubtotal(items)
  const subtotalAfterDiscount = getSubtotalAfterDiscount(subtotal, discount)
  const tax = getTax(taxPercent, subtotalAfterDiscount)
  const total = getTotal(subtotalAfterDiscount, tax, shipping)

  const discountDisplay = (discount > 0 && !isNaN(Number(discount)))
    ? numberToNumberString(Number(discount))
    : numberToNumberString(0)

  const shippingDisplay = (shipping > 0 && !isNaN(Number(shipping)))
    ? numberToNumberString(Number(shipping))
    : numberToNumberString(0)

  return pdf(
    <Document subject={JSON.stringify(invoice)}>
      <Page size="A4">
        <View
          style={{
            padding: '1in'
          }}
        >

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flexDirection: 'column', width: '25%' }}>
              <Text style={{ fontSize: 27 }}>
                INVOICE
              </Text>
            </View>

            <View style={{ flexDirection: 'column', width: '75%', textAlign: 'right' }}>
              <Text style={{ fontSize: medFontSize }}>
                {`${payee.name}`}
              </Text>

              <Text style={{ fontSize: medFontSize }}>
                {`${payee.email}`}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginTop: '30px' }}>

            { datePaid
              && (
                <View style={{ flexDirection: 'column', width: '15%', textAlign: 'left' }}>
                  <Text style={{ fontSize: largeFontSize, color: 'red' }}>
                    PAID
                  </Text>
                </View>
              )
            }

            { datePaid
              && (
                <View style={{ flexDirection: 'column', width: '20%', textAlign: 'right' }}>
                  <Text style={{ fontSize: largeFontSize, color: 'red' }}>
                    { datePaid }
                  </Text>
                </View>
              )
            }

            <View style={{ flexDirection: 'column', width: datePaid ? '65%' : '100%', textAlign: 'right' }}>
              <Text style={{ fontSize: largeFontSize }}>
                BILL TO
              </Text>
            </View>

          </View>

          <View style={{ flexDirection: 'row', marginTop: '40px' }}>
            <View style={{ flexDirection: 'column', width: '15%' }}>
              <Text style={{ fontSize: medFontSize }}>
                ISSUED
              </Text>
              <Text style={{ fontSize: medFontSize }}>
                DUE
              </Text>
              <Text style={{ fontSize: medFontSize }}>
                ID
              </Text>
            </View>

            <View style={{ flexDirection: 'column', width: '20%', textAlign: 'right' }}>
              <Text style={{ fontSize: medFontSize }}>
                { dateIssued }
              </Text>
              <Text style={{ fontSize: medFontSize }}>
                { dateDue }
              </Text>
              <Text style={{ fontSize: medFontSize }}>
                { uuid.substring(0, 8) }
              </Text>
            </View>

            <View style={{ flexDirection: 'column', width: '65%', textAlign: 'right' }}>
              <Text style={{ fontSize: medFontSize }}>
                {payor.name}
              </Text>

              { payor.email
                && (
                  <View>
                    <Text style={{ fontSize: medFontSize }}>
                      { payor.email }
                    </Text>
                  </View>
                )
              }
            </View>

          </View>

          <View style={{ marginTop: '80px', fontSize: medFontSize }}>

            {/* TABLE HEADER */}
            <View
              style={{
                flexDirection: 'row',
                lineHeight: '14px',
              }}
            >
              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: COLUMN_1_WIDTH_PERCENT,
                  textAlign: 'left',
                  backgroundColor: 'black',
                }}
              >
                <Text style={{ color: 'white' }}>
                  Item
                </Text>
              </View>

              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: COLUMN_2_WIDTH_PERCENT,
                  textAlign: 'right',
                  backgroundColor: 'black',
                }}
              >
                <Text style={{ color: 'white' }}>
                  Quantity
                </Text>
              </View>

              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: COLUMN_3_WIDTH_PERCENT,
                  textAlign: 'right',
                  backgroundColor: 'black',
                }}
              >
                <Text style={{ color: 'white' }}>
                  Price
                </Text>
              </View>

              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: COLUMN_4_WIDTH_PERCENT,
                  textAlign: 'right',
                  backgroundColor: 'black',
                }}
              >
                <Text style={{ color: 'white' }}>
                  Amount
                </Text>
              </View>
            </View>

            {/* TABLE ITEMS */}
            {
              items.map((item, i) => {
                const {
                  quantity,
                  unitPrice,
                } = item

                if (quantity < 0 || unitPrice < 0 || isNaN(Number(quantity)) || isNaN(Number(unitPrice))) return null

                return (
                  <View
                    style={{
                      flexDirection: 'row',
                      lineHeight: '12px',
                      marginTop: '8px',
                      fontSize: medFontSize,
                    }}
                    key={i}
                  >

                    <View
                      style={{
                        padding: TEXT_PADDING,
                        flexDirection: 'column',
                        width: COLUMN_1_WIDTH_PERCENT,
                        textAlign: 'left',
                      }}
                    >
                      <Text style={{ color: 'black' }}>
                        {item.name}
                      </Text>
                    </View>

                    <View
                      style={{
                        padding: TEXT_PADDING,
                        flexDirection: 'column',
                        width: COLUMN_2_WIDTH_PERCENT,
                        textAlign: 'right',
                      }}
                    >
                      <Text style={{ color: 'black' }}>
                        {item.quantity}
                      </Text>
                    </View>

                    <View
                      style={{
                        padding: TEXT_PADDING,
                        flexDirection: 'column',
                        width: COLUMN_3_WIDTH_PERCENT,
                        textAlign: 'right',
                      }}
                    >
                      <Text style={{ color: 'black' }}>
                        { numberToNumberString(Number(item.unitPrice)) }
                      </Text>
                    </View>

                    <View
                      style={{
                        padding: TEXT_PADDING,
                        flexDirection: 'column',
                        width: COLUMN_4_WIDTH_PERCENT,
                        textAlign: 'right',
                      }}
                    >
                      <Text style={{ color: 'black' }}>
                        { currencySymbolMap[currency] + numberToNumberString(getItemAmount(item)) }
                      </Text>
                    </View>

                  </View>
                )
              })
            }

            {/* TABLE FOOTER */}
            <View
              style={{
                // this and the next view are used to create a double border
                flexDirection: 'row',
                backgroundColor: 'black',
                marginTop: 5,
                height: 1,
                width: `${COLUMN_2_WIDTH + COLUMN_3_WIDTH + COLUMN_4_WIDTH}%`,
                marginLeft: `${COLUMN_1_WIDTH}%`
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: 'black',
                marginTop: 1,
                marginBottom: 5,
                height: 1,
                width: `${COLUMN_2_WIDTH + COLUMN_3_WIDTH + COLUMN_4_WIDTH}%`,
                marginLeft: `${COLUMN_1_WIDTH}%`
              }}
            />

            { (discount || taxPercent || shipping || null) && <View
              style={{
                flexDirection: 'row',
                lineHeight: '14px',
              }}
            >
              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: `${COLUMN_1_WIDTH + COLUMN_2_WIDTH + COLUMN_3_WIDTH}%`,
                  textAlign: 'right',
                }}
              >
                <Text>
                  SUBTOTAL
                </Text>
              </View>

              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: COLUMN_4_WIDTH_PERCENT,
                  textAlign: 'right',
                }}
              >
                <Text>
                  { currencySymbolMap[currency] + numberToNumberString(subtotal) }
                </Text>
              </View>
            </View>
            }

            { (discount || null)
              && (
                <View
                  style={{
                    flexDirection: 'row',
                    lineHeight: '14px',
                  }}
                >
                  <View
                    style={{
                      padding: TEXT_PADDING,
                      flexDirection: 'column',
                      width: `${COLUMN_1_WIDTH + COLUMN_2_WIDTH + COLUMN_3_WIDTH}%`,
                      textAlign: 'right',
                    }}
                  >
                    <Text>
                      DISCOUNT
                    </Text>
                  </View>

                  <View
                    style={{
                      padding: TEXT_PADDING,
                      flexDirection: 'column',
                      width: COLUMN_4_WIDTH_PERCENT,
                      textAlign: 'right',
                    }}
                  >
                    <Text>
                      { currencySymbolMap[currency] + discountDisplay }
                    </Text>
                  </View>
                </View>
            )}

            { (taxPercent || null) && (
              <View
              style={{
                flexDirection: 'row',
                lineHeight: '14px',
              }}
            >
                <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: `${COLUMN_1_WIDTH + COLUMN_2_WIDTH + COLUMN_3_WIDTH}%`,
                  textAlign: 'right',
                }}
              >
                  <Text>
                    TAX ({taxPercent}%)
                  </Text>
                </View>

                <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: COLUMN_4_WIDTH_PERCENT,
                  textAlign: 'right',
                }}
              >
                  <Text>
                    { currencySymbolMap[currency] + numberToNumberString(tax) }
                  </Text>
                </View>
              </View>
            )}

            {(shipping || null) && (
              <View
                  style={{
                    flexDirection: 'row',
                    lineHeight: '14px',
                  }}
                >
                <View
                    style={{
                      padding: TEXT_PADDING,
                      flexDirection: 'column',
                      width: `${COLUMN_1_WIDTH + COLUMN_2_WIDTH + COLUMN_3_WIDTH}%`,
                      textAlign: 'right',
                    }}
                  >
                  <Text>
                    SHIPPING
                  </Text>
                </View>

                <View
                    style={{
                      padding: TEXT_PADDING,
                      flexDirection: 'column',
                      width: COLUMN_4_WIDTH_PERCENT,
                      textAlign: 'right',
                    }}
                  >
                  <Text>
                    { currencySymbolMap[currency] + shippingDisplay }
                  </Text>
                </View>
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                lineHeight: '14px',
              }}
            >
              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: `${COLUMN_1_WIDTH}%`,
                  textAlign: 'left',
                  marginTop: (discount || taxPercent || shipping) ? '0' : '28px'
                }}
              >
                <Text>
                  {note}
                </Text>
              </View>

              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: `${COLUMN_2_WIDTH + COLUMN_3_WIDTH}%`,
                  textAlign: 'right',
                }}
              >
                <Text>
                  TOTAL
                </Text>
              </View>

              <View
                style={{
                  padding: TEXT_PADDING,
                  flexDirection: 'column',
                  width: COLUMN_4_WIDTH_PERCENT,
                  textAlign: 'right',
                }}
              >
                <Text>
                  { currencySymbolMap[currency] + numberToNumberString(total) }
                </Text>
              </View>
            </View>
          </View>

        </View>

      </Page>
    </Document>
  )
}

export default InvoicePdf
