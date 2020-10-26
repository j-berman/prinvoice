import React, { Component } from 'react'
import { object } from 'prop-types'
import { getInvoices } from './logic'
import './InvoicesDashboard.css'
import InvoicesDashboardRow from './InvoicesDashboardRow'

export default class InvoicesDashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      invoices: getInvoices(this.props.sqlJsDb),
      error: undefined,
      loading: false,
      updatingRowStatus: false
    }
  }

  componentDidMount() {
    this._isMounted = true
  }

  componentWillUnmount() {
    this._isMounted = false
  }


  handleUpdatingRowStatus = (updatingRowStatus) => {
    if (this._isMounted) this.setState({ updatingRowStatus })
  }

  render() {
    const {
      invoices,
      updatingRowStatus
    } = this.state

    return (
      <div id='invoice-dashboard' className='dashboard-with-table max-screen-width'>
        <div className='dashboard-with-table-total'>{invoices.length} invoice{invoices.length === 1 ? '' : 's'}</div>
        <div className='dashboard-with-table-outer-container'>
          <div className='container'>
            <table className='dashboard-table'>
              <thead>
                <tr>
                  <th className='invoice-dashboard-customer'>Customer</th>
                  <th className='invoice-dashboard-date-due'>Due</th>
                  <th className='invoice-dashboard-date-paid'>Status</th>
                  <th className='invoice-dashboard-amount' style={{ textAlign: 'right'}}>Amount</th>
                  <th className='invoice-dashboard-ellipsis'></th>
                </tr>
              </thead>

              {invoices.length > 0 &&
                <tbody>
                  {invoices.map(invoice => <InvoicesDashboardRow
                    key={invoice.uuid}
                    invoice={invoice}
                    handleUpdatingRowStatus={this.handleUpdatingRowStatus}
                    updatingRowStatus={updatingRowStatus}
                    sqlJsDb={this.props.sqlJsDb}
                  />)}
                </tbody>
              }

            </table>

            {!invoices.length && <div className='create-invoice-to-get-started'><a href='#new-invoice'>Create an invoice</a> to get started.</div>}

          </div>
        </div>
      </div>
    )
  }
}

InvoicesDashboard.propTypes = {
  sqlJsDb: object
}
