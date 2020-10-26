import React, { Component } from 'react'
import { object } from 'prop-types'
import { getCustomers } from './logic'
import './CustomersDashboard.css'
import {
  currencySymbolMap,
  numberToNumberString,
} from '../../utils'

export default class CustomersDashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      customers: getCustomers(this.props.sqlJsDb, this.props.user.userId)
    }
  }

  render() {
    const { customers } = this.state

    return (
      <div id='customer-dashboard' className='dashboard-with-table max-screen-width'>
        <div className='dashboard-with-table-total'>{customers.length} customer{customers.length === 1 ? '' : 's'}</div>
        <div className='dashboard-with-table-outer-container'>
          <div className='container'>
            <table className='dashboard-table'>
              <thead>
                <tr>
                  <th className='customer-dashboard-customer'>Customer</th>
                  <th className='customer-dashboard-email'>Email</th>
                  <th className='customer-dashboard-owes' style={{ textAlign: 'right'}}>Owes</th>
                  <th className='customer-dashboard-received' style={{ textAlign: 'right'}}>Received</th>
                </tr>
              </thead>

              {customers.length > 0 &&
                <tbody>
                  {customers.map(cust => {
                    const {
                      customer,
                      email,
                      currency,
                      amount_owes,
                      amount_received,
                    } = cust

                    return (
                      <tr key={customer}>
                        <td className='customer-dashboard-customer'>{customer}</td>
                        <td className='customer-dashboard-email'>{email || ''}</td>
                        <td className='customer-dashboard-owes' style={{ textAlign: 'right' }}><span className='customer-dashboard-owes-prefix'>Owes: </span>{amount_owes ? `${currencySymbolMap[currency]}${numberToNumberString(amount_owes)}` : '-'}</td>
                        <td className={'customer-dashboard-received' + (amount_received ? ' received' : '')} style={{ textAlign: 'right' }}>
                          {amount_received ? `${currencySymbolMap[currency]}${numberToNumberString(amount_received)}` : '-'}
                        </td>
                      </tr>
                    )
                  })}

                </tbody>
              }

            </table>

            {!customers.length && <div className='create-invoice-to-get-started'><a href='#new-invoice'>Create an invoice</a> to get started.</div>}

          </div>
        </div>
      </div>
    )
  }
}

CustomersDashboard.propTypes = {
  sqlJsDb: object,
  user: object
}
