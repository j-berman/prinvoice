import React, { Component } from 'react'
import { object, func } from 'prop-types'
import './Account.css'
import { getCurrency } from '../Dashboard/logic'
import { DEFAULT_CURRENCY } from '../../config'
import { currencySymbolMap } from '../../utils'
import { updateDefaultCurrency } from './logic'

export default class Account extends Component {
  constructor(props) {
    super(props)

    const { user, sqlJsDb } = this.props
    const { username, userId } = user

    this.state = {
      username,
      currency: getCurrency(sqlJsDb, userId) || DEFAULT_CURRENCY,
      loadingUpdateAccount: false,
      errorUpdateAccount: undefined,
      loadingUpdatePassword: false,
      errorUpdatePassword: undefined
    }
  }

  componentDidMount() {
    this._isMounted = true
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  handleInputChange = (event) => {
    if (this.state.error) this.setState({ error: undefined })

    const target = event.target
    const value = target.value
    const name = target.name

    this.setState({
      [name]: value
    })
  }

  handleChangeCurrency = (e) => {
    this.setState({ currency: e.target.value })
  }

  handleUpdateAccount = async (e) => {
    e.preventDefault()
    const { user } = this.props
    const {
      username,
      currency,
      loadingUpdateAccount
    } = this.state

    if (loadingUpdateAccount) return
    this.setState({ loadingUpdateAccount: true, errorUpdateAccount: undefined  })

    try {
      await Promise.all([
        user.username !== username && window.userbase.updateUser({ username, email: username }),
        updateDefaultCurrency(user.userId, currency)
      ])

      if (this._isMounted) this.setState({ loadingUpdateAccount: false })
    } catch (e) {
      if (this._isMounted) this.setState({ loadingUpdateAccount: false, errorUpdateAccount: e.message })
    }

  }

  handleUpdatePassowrd = async (e) => {
    e.preventDefault()
    const { currentPassword, newPassword, loadingUpdatePassword } = this.state

    if (loadingUpdatePassword) return
    this.setState({ loadingUpdatePassword: true, errorUpdatePassword: undefined  })

    try {
      await window.userbase.updateUser({ currentPassword, newPassword })

      if (this._isMounted) this.setState({ loadingUpdatePassword: false })
    } catch (e) {
      if (this._isMounted) this.setState({ loadingUpdatePassword: false, errorUpdatePassword: e.message })
    }
  }

  handleDeleteAccount = async (e) => {
    e.preventDefault()
    if (window.confirm('Are you sure you want to delete your account?')) {
      await window.userbase.deleteUser()
      this.props.handleResetState()
    }
  }

  render() {
    const {
      username,
      currency,
      loadingUpdateAccount,
      errorUpdateAccount,
      loadingUpdatePassword,
      errorUpdatePassword,
    } = this.state

    return (
      <div id='account-page'>
        <div className='container'>

          <div className='account-page-section'>
            <div className='account-page-header-section'>
              <span className='account-page-header'>Edit account</span>
              <div className='account-page-header-line' />
            </div>

            <form onSubmit={this.handleUpdateAccount}>
              <div className='account-page-form-input-section'>
                <label>Email</label>
                <input
                  className='text-input'
                  type='email'
                  name='username'
                  autoComplete='username'
                  onChange={this.handleInputChange}
                  defaultValue={username}
                  placeholder='Email'
                />
              </div>

              <div className='account-page-form-input-section'>
                <label>Default currency</label>
                <select id='account-page-currency-selector' className='text-input' defaultValue={currency} onChange={this.handleChangeCurrency}>
                  {Object.keys(currencySymbolMap).map(currencyOption => {
                      return <option value={currencyOption} key={currencyOption}>{currencyOption}</option>
                    })}
                </select>
              </div>

              <input
                className='button'
                type='submit'
                value='Update account'
                disabled={loadingUpdateAccount}
              />

              {errorUpdateAccount && <div className='error'>{errorUpdateAccount}</div>}
            </form>
          </div>

          <div className='account-page-section'>
            <div className='account-page-header-section'>
              <span className='account-page-header'>Change password</span>
              <div className='account-page-header-line' />
            </div>

            <form onSubmit={this.handleUpdatePassowrd}>
              <div className='account-page-form-input-section'>
                <label>Current password</label>
                <input
                  className='text-input'
                  type='password'
                  name='currentPassword'
                  autoComplete='password'
                  onChange={this.handleInputChange}
                  placeholder='Current password'
                />
              </div>

              <div style={{ marginTop: '1em' }} className='account-page-form-input-section'>
                <label>New password</label>
                <input
                  className='text-input'
                  type='password'
                  name='newPassword'
                  autoComplete='new-password'
                  onChange={this.handleInputChange}
                  placeholder='New password'
                />
              </div>

              <input
                className='button'
                type='submit'
                value='Update password'
                disabled={loadingUpdatePassword}
              />

              {errorUpdatePassword && <div className='error'>{errorUpdatePassword}</div>}
            </form>
          </div>

          <div className='account-page-section'>
            <div className='account-page-header-section'>
              <span className='account-page-header dangerous'>Danger zone</span>
              <div className='account-page-header-line' />
            </div>

            <form onSubmit={this.handleDeleteAccount}>
              <input
                id='delete-account-button'
                className='button'
                type='submit'
                value='Delete account'
              />
            </form>
          </div>

        </div>
      </div>
    )
  }
}

Account.propTypes = {
  sqlJsDb: object,
  user: object,
  handleResetState: func
}
