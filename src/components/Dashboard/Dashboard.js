import React, { Component } from 'react'
import { object } from 'prop-types'
import { Bar, HorizontalBar } from 'react-chartjs-2'
import './Dashboard.css'
import {
  currencySymbolMap,
  numberToNumberString,
} from '../../utils'
import {
  getCurrency,
  getMonthlySales,
  getSalesByCustomer,
  getSalesByProduct,
  hasCreatedInvoice,
  getTotals,
  getCustomerCount,
} from './logic'

export default class Dashboard extends Component {
  constructor(props) {
    super(props)

    const {
      sqlJsDb,
      user
    } = this.props
    const { userId } = user

    if (hasCreatedInvoice(sqlJsDb)) {
      const currency = getCurrency(sqlJsDb, userId)
      const monthlySales = getMonthlySales(sqlJsDb, currency)
      const salesByCustomer = getSalesByCustomer(sqlJsDb, currency)
      const salesByProduct = getSalesByProduct(sqlJsDb, currency)
      const { total, received, owed, overdue } = getTotals(sqlJsDb, currency)
      const customerCount = getCustomerCount(sqlJsDb)

      this.state = {
        currency,
        monthlySales,
        salesByCustomer,
        salesByProduct,
        total,
        received,
        owed,
        overdue,
        customerCount,
      }
    } else {
      this.state = {
        suggestCreateInvoice: true
      }
    }
  }

  render() {
    const {
      suggestCreateInvoice,
      currency,
      monthlySales,
      salesByCustomer,
      salesByProduct,
      total,
      received,
      owed,
      overdue,
      customerCount,
    } = this.state

    const displayTotal = suggestCreateInvoice ? '0' : (currencySymbolMap[currency] + numberToNumberString(total || 0))
    const displayReceived = suggestCreateInvoice ? '0' : (currencySymbolMap[currency] + numberToNumberString(received || 0))
    const displayOwed = suggestCreateInvoice ? '0' : (currencySymbolMap[currency] + numberToNumberString(owed || 0))
    const displayOverdue = suggestCreateInvoice ? '0' : (currencySymbolMap[currency] + numberToNumberString(overdue || 0))

    return (
      <div id='dashboard'>
        <div className='dashboard-outer-container'>
          <div className='container left-container'>
            <div id='dashboard-total-row'>
              <div id='dashboard-total-row-header'>Total</div>
              <div id='dashboard-total-row-value'>{displayTotal}</div>
            </div>

            <div id='dashboard-invoice-values-grid'>
              <div id='dashboard-received-value'>
                <div className='dashboard-invoice-values-header'>Received</div>
                <div className='dashboard-invoice-values-value'>{displayReceived}</div>
              </div>

              <div id='dashboard-owed-value'>
                <div className='dashboard-invoice-values-header'>Owed</div>
                <div className='dashboard-invoice-values-value'>{displayOwed}</div>
              </div>

              <div id='dashboard-overdue-value'>
                <div className='dashboard-invoice-values-header'>Overdue</div>
                <div className='dashboard-invoice-values-value'>{displayOverdue}</div>
              </div>
            </div>

            <div id='dashboard-customers-row'>
              <div id='dashboard-customers-row-header'>Customers</div>
              <div id='dashboard-customers-row-value'>{customerCount || 0}</div>
            </div>

          </div>
        </div>

        <div className='dashboard-outer-container'>
          <div className='container right-container'>
            <div className='chart-header'>Sales</div>
            { suggestCreateInvoice
            ? <div className='create-invoice-to-get-started'><a href='#new-invoice'>Create an invoice</a> to get started.</div>
            : <Bar
              id='sales-by-month-chart'
              data={{
                labels: monthlySales.months,
                datasets: [{
                  data: monthlySales.sales,
                  label: 'Sales Revenue',
                  backgroundColor: '#c3eee7',
                  borderColor: '#66bbae',
                  borderWidth: 1
                }]}}
              options={{
                maintainAspectRatio: false,
                scales: {
                  xAxes: [
                    {
                      gridLines: {
                        drawBorder: true,
                        lineWidth: 0
                      }
                    }
                  ],
                  yAxes: [
                    {
                      gridLines: {
                        drawBorder: true,
                        lineWidth: 0
                      },
                      ticks: {
                        min: 0,
                        callback: function (value) {
                          return currencySymbolMap[currency] + numberToNumberString(value, 0)
                        },
                        fontColor: 'black'
                      }
                    }
                  ]
                },
                tooltips: {
                  callbacks: {
                      label: function(tooltipItems) {
                          return currencySymbolMap[currency] + numberToNumberString(tooltipItems.yLabel)
                      }
                  }
                },
              }}
              legend={null}
            />
          }
          </div>
        </div>

        <div className='dashboard-outer-container'>
          <div id='sales-by-customer' className='container left-container'>
            <div className='chart-header'>Sales by Customer</div>
            { suggestCreateInvoice
              ? <div className='create-invoice-to-get-started'><a href='#new-invoice'>Create an invoice</a> to get started.</div>
              : <HorizontalBar
                data={{
                  labels: salesByCustomer.customers,
                  datasets: [{
                    data: salesByCustomer.sales,
                    label: 'Sales Revenue',
                    backgroundColor: '#c3eee7',
                    borderColor: '#66bbae',
                    borderWidth: 1
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    xAxes: [
                      {
                        gridLines: {
                          display: false
                        },
                        ticks: {
                          min: 0,
                          callback: function (value) {
                            return currencySymbolMap[currency] + numberToNumberString(value, 0)
                          },
                          fontColor: 'black'
                        }
                      }
                    ],
                    yAxes: [
                      {
                        gridLines: {
                          display: true
                        },
                        ticks: {
                          // shorten long labels
                          callback: function(label) {
                            const MAX_WORD_LEN = 10
                            if (typeof label === 'string' && label.length > MAX_WORD_LEN) {
                              return label.substring(0, MAX_WORD_LEN) + '…'
                            } else {
                              return label
                            }
                          }
                        }
                      },
                    ]
                  },
                  tooltips: {
                    callbacks: {
                        label: function(tooltipItems) {
                            return currencySymbolMap[currency] + numberToNumberString(tooltipItems.xLabel)
                        }
                    }
                  },
                }}
                legend={null}
              />
            }
          </div>
        </div>

        <div className='dashboard-outer-container'>
          <div id='sales-by-product' className='container right-container'>
            <div className='chart-header'>Sales by Product</div>
            { suggestCreateInvoice
            ? <div className='create-invoice-to-get-started'><a href='#new-invoice'>Create an invoice</a> to get started.</div>
            : <HorizontalBar
              data={{
                labels: salesByProduct.products,
                datasets: [{
                  data: salesByProduct.sales,
                  label: 'Sales Revenue',
                  backgroundColor: '#c3eee7',
                  borderColor: '#66bbae',
                  borderWidth: 1
                }]
              }}
              options={{
                maintainAspectRatio: false,
                scales: {
                  xAxes: [
                    {
                      gridLines: {
                        display: false
                      },
                      ticks: {
                        min: 0,
                        callback: function (value) {
                          return currencySymbolMap[currency] + numberToNumberString(value, 0)
                        },
                        fontColor: 'black'
                      }
                    }
                  ],
                  yAxes: [
                    {
                      gridLines: {
                        display: true
                      },
                      ticks: {
                        // shorten long labels
                        callback: function(label) {
                          const MAX_WORD_LEN = 10
                          if (typeof label === 'string' && label.length > MAX_WORD_LEN) {
                            return label.substring(0, MAX_WORD_LEN) + '…'
                          } else {
                            return label
                          }
                        }
                      }
                    },
                  ]
                },
                tooltips: {
                  callbacks: {
                      label: function(tooltipItems) {
                          return currencySymbolMap[currency] + numberToNumberString(tooltipItems.xLabel)
                      }
                  }
                },
              }}
              legend={null}
            />
          }
          </div>
        </div>
      </div>
    )
  }
}

Dashboard.propTypes = {
  sqlJsDb: object,
  user: object
}
