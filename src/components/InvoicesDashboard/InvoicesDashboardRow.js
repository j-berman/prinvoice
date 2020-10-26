import React, { Component } from 'react'
import { object, func, bool } from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons/faEnvelope'
import { faFilePdf } from '@fortawesome/free-regular-svg-icons/faFilePdf'
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons/faTrashAlt'
import './InvoicesDashboard.css'
import {
  toUniversalDateFormat,
  currencySymbolMap,
  numberToNumberString,
  dateFormatRegex,
  isValidDate,
} from '../../utils'
import {
  setDatePaid,
  getInvoiceItems,
  getInvoiceObjectForExport,
  deleteInvoice,
 } from './logic'
import {
  emailInvoiceLink,
  downloadInvoicePdf
} from '../NewInvoiceForm/logic'

export default class InvoicesDashboardRow extends Component {
  constructor(props) {
    super(props)

    this.state = {
      editingDatePaid: false,
      datePaidInEditMode: this.props.invoice.date_paid || new Date(),
      loading: false,
      rowMenuOpen: false
    }

    this.datePaidEditor = React.createRef()
    this.rowMenu = React.createRef()
  }

  componentDidMount() {
    this._isMounted = true
    document.addEventListener('mousedown', this.handleClickOutsideDatePaidEditor)
    document.addEventListener('mousedown', this.handleClickOutsideRowMenu)
    document.addEventListener('keydown', this.handleHitEnter)
  }

  componentWillUnmount() {
    this._isMounted = false
    document.removeEventListener('mousedown', this.handleClickOutsideDatePaidEditor)
    document.removeEventListener('mousedown', this.handleClickOutsideRowMenu)
    document.removeEventListener('keydown', this.handleHitEnter)
  }

  handleClickOutsideDatePaidEditor = async (e) => {
    const { editingDatePaid, datePaidInEditMode } = this.state
    if (!editingDatePaid) return
    if (editingDatePaid && this.datePaidEditor && !this.datePaidEditor.current.contains(e.target)) {
      await this.handleSetDatePaid(this.props.invoice.uuid, datePaidInEditMode)
    }
  }

  handleClickOutsideRowMenu = async (e) => {
    const { rowMenuOpen } = this.state
    if (!rowMenuOpen) return
    if (this.rowMenu && !this.rowMenu.current.contains(e.target)) {
      this.setState({ rowMenuOpen: false })
    }
  }

  handleHitEnter = async (e) => {
    const { editingDatePaid, datePaidInEditMode } = this.state
    if (!editingDatePaid) return
    const ENTER_KEY_CODE = 13
    if (e.key === 'Enter' || e.keyCode === ENTER_KEY_CODE) {
      await this.handleSetDatePaid(this.props.invoice.uuid, datePaidInEditMode)
    }
  }

  handleEditDatePaid = async () => {
    const { updatingRowStatus, handleUpdatingRowStatus } = this.props
    const { editingDatePaid } = this.state
    if (updatingRowStatus || editingDatePaid) return
    this.setState({ editingDatePaid: true, rowMenuOpen: false })
    handleUpdatingRowStatus(true)
  }

  handleUpdateDate = (e) => {
    this.setState({ datePaidInEditMode: e.target.value })
  }

  handleUnsetDatePaid = async () => {
    const datePaid = null
    await this.handleSetDatePaid(this.props.invoice.uuid, datePaid)
  }

  handleSetDatePaid = async (invoiceUuid, datePaid) => {
    const { handleUpdatingRowStatus } = this.props

    const { loading } = this.state
    if (loading) return

    const { date_paid } = this.props.invoice

    // no need to push changes to server
    if (datePaid === date_paid) {
      this.setState({ editingDatePaid: false })
      handleUpdatingRowStatus(false)
      return
    }

    try {
      const finalDatePaid = datePaid === null ? datePaid : new Date(datePaid)
      if (finalDatePaid !== null && !isValidDate(finalDatePaid)) return
      this.setState({ loading: true })

      await setDatePaid(invoiceUuid, finalDatePaid)
    } catch {
      // swallow error
    }

    if (this._isMounted) {
      this.setState({ loading: false, editingDatePaid: false })
      handleUpdatingRowStatus(false)
    }
  }

  handleToggleRowMenu = () => {
    const { rowMenuOpen } = this.state
    this.setState({ rowMenuOpen: !rowMenuOpen })
  }

  handleEmailInvoiceLink = () => {
    const { invoice, sqlJsDb } = this.props
    const invoiceItems = getInvoiceItems(sqlJsDb, invoice.uuid)
    const invoiceObject = getInvoiceObjectForExport(invoice, invoiceItems)
    window.location.href = emailInvoiceLink(invoiceObject)
  }

  handleDownloadInvoicePdf = async () => {
    const { invoice, sqlJsDb } = this.props
    const invoiceItems = getInvoiceItems(sqlJsDb, invoice.uuid)
    const invoiceObject = getInvoiceObjectForExport(invoice, invoiceItems)
    await downloadInvoicePdf(invoiceObject)
  }

  handleDeleteInvocie = async () => {
    const { invoice: { uuid }} = this.props
    try {
      await deleteInvoice(uuid)
    } catch {
      // swallow error
    }
  }

  render() {
    const {
      invoice,
      updatingRowStatus
     } = this.props
    const {
      customer,
      date_due,
      date_paid,
      currency,
      total
    } = invoice
    const {
      editingDatePaid,
      datePaidInEditMode,
      loading,
      rowMenuOpen
    } = this.state

    return (
      <tr>
        <td className='invoice-dashboard-row-customer'>{customer}</td>
        <td className='invoice-dashboard-row-date-due'><span className='invoice-dashboard-row-due-prefix'>Due: </span>{date_due ? new Date(date_due).toLocaleDateString() : '-'}</td>
        <td className={'invoice-dashboard-date-paid' + (date_paid ? ' paid' : '') + ((updatingRowStatus && !editingDatePaid) ? ' editing-another-date-paid' : '')}>
          { loading
            ? <div className='loader'></div>
            : (!editingDatePaid
              ? <span onClick={this.handleEditDatePaid}>{date_paid ? 'Paid' : 'Unpaid'}</span>
              : <div ref={this.datePaidEditor}>
                <input
                  className='text-input validity'
                  type='date'
                  defaultValue={toUniversalDateFormat(datePaidInEditMode)}
                  placeholder='yyyy-mm-dd' // for safari
                  pattern={dateFormatRegex}
                  maxLength={10}
                  onChange={this.handleUpdateDate}
                />
                <span onClick={this.handleUnsetDatePaid} className='invoice-dashboard-unset-date-paid'>X</span>
              </div>
            )
          }
        </td>
        <td className='invoice-dashboard-amount' style={{ textAlign: 'right' }}>{currencySymbolMap[currency]}{numberToNumberString(total)}</td>
        <td className='invoice-dashboard-ellipsis-wrapper' ref={this.rowMenu} onClick={this.handleToggleRowMenu}>
          <div className={'invoice-dashboard-ellipsis no-select'  + (rowMenuOpen ? ' active' : '')}>...</div>
          <div id='invoice-dashboard-ellipsis-dropdown-wrapper'>
            <div className={'dropdown' + (rowMenuOpen ? ' active' : '')}>
              <div className='dropdown-content'>
                <div className='dropdown-item' onClick={this.handleEditDatePaid}>Mark as {date_paid ? 'unpaid' : 'paid'}<span className='float-right'>{currencySymbolMap[currency]}</span></div>
                <div className='dropdown-divider' />
                <div className='dropdown-item' onClick={this.handleEmailInvoiceLink}>Send<span className='float-right'><FontAwesomeIcon icon={faEnvelope} /></span></div>
                <div className='dropdown-item' onClick={this.handleDownloadInvoicePdf}>Download PDF<span className='float-right'><FontAwesomeIcon icon={faFilePdf} /></span></div>
                <div className='dropdown-divider' />
                <div className='dropdown-item dangerous-hover' onClick={this.handleDeleteInvocie}>Delete<span className='float-right'><FontAwesomeIcon icon={faTrashAlt} /></span></div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )
  }
}

InvoicesDashboardRow.propTypes = {
  invoice: object,
  handleUpdatingRowStatus: func,
  updatingRowStatus: bool,
  sqlJsDb: object
}
