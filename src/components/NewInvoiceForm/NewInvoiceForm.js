import React, { Component } from 'react'
import { object } from 'prop-types'
import { v4 as uuidv4 } from 'uuid'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons/faExclamationTriangle'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons/faEnvelope'
import { faFilePdf } from '@fortawesome/free-regular-svg-icons/faFilePdf'
import './NewInvoiceForm.css'
import {
  newEmptyInvoice,
  newEmptyInvoiceItem,
  getSubtotal,
  getSubtotalAfterDiscount,
  getTax,
  getTotal,
  validateInvoice,
  createInvoice,
  getCustomers,
  getProducts,
  emailInvoiceLink,
  downloadInvoicePdf,
} from './logic'
import {
  toUniversalDateFormat,
  dateFormatRegex,
  currencySymbolMap,
  numberToNumberString,
  getSpanWithTextHighlighted,
} from '../../utils'
import NewInvoiceFormItemRow from './NewInvoiceFormItemRow'

export default class NewInvoiceForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      errors: [],
      errorMap: { items: {}, payor: {}, payee: {} },
      loading: false,
      invoice: newEmptyInvoice(this.props.sqlJsDb, this.props.user),
      editingTax: false,
      customerDropdownOptions: getCustomers(this.props.sqlJsDb),
      productDropdownOptions: getProducts(this.props.sqlJsDb),
      customerDropdownOpen: false,
      moreOptionsOpen: false
    }

    this.topOfPageRef = React.createRef()
    this.customerDropdownRef = React.createRef()
    this.taxWrapperRef = React.createRef()
    this.moreOptionsRef = React.createRef()
    this.mobileMoreOptionsRef = React.createRef()
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutsideTaxWrapper)
    document.addEventListener('mousedown', this.handleClickOutsideCustomersDropdown)
    document.addEventListener('mousedown', this.handleClickOutsideMoreOptionsDropdown)
    document.addEventListener('keydown', this.handleHitEnter)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutsideTaxWrapper)
    document.removeEventListener('mousedown', this.handleClickOutsideCustomersDropdown)
    document.removeEventListener('mousedown', this.handleClickOutsideMoreOptionsDropdown)
    document.removeEventListener('keydown', this.handleHitEnter)
  }

  handleUpdateAgent = (agent, property, value) => {
    const { invoice, errorMap } = this.state
    invoice[agent][property] = value

    delete errorMap[agent][property]

    let customerDropdownOpen = false
    if (agent === 'payor' && property === 'name') {
      customerDropdownOpen = true
      invoice[agent].uuid = uuidv4() // ensures not using an existing UUID if changing name
    }

    this.setState({ invoice, errorMap, customerDropdownOpen })
  }

  handleChangeCurrency = (e) => {
    const { invoice } = this.state
    this.setState({ invoice: { ...invoice, currency: e.target.value }})
  }

  handleAddItem = () => {
    const { invoice } = this.state
    const { items } = invoice
    items.push(newEmptyInvoiceItem())
    this.setState({ invoice: { ...invoice, items }})
  }

  handleRemoveItem = (itemResourceUuid) => {
    const { invoice, errorMap } = this.state
    const { items } = invoice

    const itemsWithItemRemoved = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.resourceUuid !== itemResourceUuid) itemsWithItemRemoved.push(item)
    }

    delete errorMap.items[itemResourceUuid]

    this.setState({ invoice: { ...invoice, items: itemsWithItemRemoved }, errorMap })
  }

  handleUpdateItem = (indexGuess, itemResourceUuid, property, value) => {
    const { invoice, errorMap } = this.state
    const { items } = invoice

    const itemGuess = items[indexGuess]
    if (itemGuess && itemGuess.resourceUuid === itemResourceUuid) {
      // cache hit with guess, ok to update item value
      items[indexGuess][property] = value
      items[indexGuess].resourceUuid = property === 'name' ? uuidv4() : items[indexGuess].resourceUuid
    } else {
      // fallback to finding item with correct resourceUuid
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.resourceUuid === itemResourceUuid) {
          item[property] = value
          item.resourceUuid = property === 'name' ? uuidv4() : item.resourceUuid
        }
      }
    }

    if (errorMap.items[itemResourceUuid]) delete errorMap.items[itemResourceUuid][property]

    this.setState({ invoice: { ...invoice, items }, errorMap })
  }

  handleUpdateInvoiceProperty = (property, value) => {
    const { invoice, errorMap } = this.state
    invoice[property] = value

    delete errorMap[property]

    this.setState({ invoice, errorMap })
  }

  handleOpenTaxEditor = () => {
    this.setState({ editingTax: true })
  }

  // https://stackoverflow.com/questions/32553158/detect-click-outside-react-component
  handleClickOutsideTaxWrapper = (e) => {
    const { editingTax } = this.state
    if (!editingTax) return
    if (this.taxWrapperRef && !this.taxWrapperRef.current.contains(e.target)) {
      this.setState({ editingTax: false })
    }
  }

  handleClickOutsideCustomersDropdown = (e) => {
    const { customerDropdownOpen } = this.state
    if (!customerDropdownOpen) return
    if (this.customerDropdownRef && !this.customerDropdownRef.current.contains(e.target)) {
      this.setState({ customerDropdownOpen: false })
    }
  }

  handleHitEnter = (e) => {
    const { editingTax, customerDropdownOpen } = this.state
    if (!editingTax && !customerDropdownOpen) return
    const ENTER_KEY_CODE = 13
    if (e.key === 'Enter' || e.keyCode === ENTER_KEY_CODE) {
      this.setState({ editingTax: false, customerDropdownOpen: false })
    }
  }

  handleSaveInvoice = async () => {
    const { invoice, loading, errorMap } = this.state
    if (loading) return

    this.setState({ loading: true })

    try {
      this.topOfPageRef.current.scrollIntoView({ behavior: 'smooth' })

      validateInvoice(invoice)
      await createInvoice(invoice)

      this.setState({ loading: false })
      window.location.hash = '#invoices'
    } catch (e) {
      this.setState({ loading: false, errors: e.errors || [e.message], errorMap: e.errorMap || errorMap })
    }
  }

  handleToggleDropdown = (dropdownName, dropdownOpen) => {
    this.setState({ [dropdownName]: dropdownOpen })
  }

  handleSetPayor = (customer) => {
    const { invoice, errorMap } = this.state
    delete errorMap.payor.name
    this.setState({ invoice: { ...invoice, payor: { ...customer }, errorMap }, customerDropdownOpen: false })
  }

  handleSetItem = (itemNumber, product) => {
    const { invoice } = this.state
    const { items } = invoice
    const { uuid, name, unit_price } = product

    items[itemNumber] = {
      resourceUuid: uuid,
      unitPrice: unit_price,
      name,
      quantity: 1,
    }

    this.setState({ invoice: { ...invoice, items } })
  }

  handleClickOutsideMoreOptionsDropdown = (e) => {
    const { moreOptionsOpen } = this.state
    if (!moreOptionsOpen) return
    if (this.moreOptionsRef && !this.moreOptionsRef.current.contains(e.target) &&
      this.mobileMoreOptionsRef && !this.mobileMoreOptionsRef.current.contains(e.target)) {
      this.setState({ moreOptionsOpen: false })
    }
  }

  handleToggleMoreOptions = () => {
    const { moreOptionsOpen } = this.state
    this.setState({ moreOptionsOpen: !moreOptionsOpen })
  }

  render() {
    const {
      invoice,
      editingTax,
      loading,
      errors,
      errorMap,
      customerDropdownOptions,
      customerDropdownOpen,
      moreOptionsOpen,
    } = this.state

    const {
      uuid,
      payee,
      payor,
      dateIssued,
      dateDue,
      currency,
      items,
      discount,
      taxPercent,
      shipping,
    } = invoice

    const subtotal = getSubtotal(items)
    const subtotalAfterDiscount = getSubtotalAfterDiscount(subtotal, discount)
    const tax = getTax(taxPercent, subtotalAfterDiscount)
    const total = getTotal(subtotalAfterDiscount, tax, shipping)

    return (
      <div id='new-invoice-page' ref={this.topOfPageRef}>

        <div className='topnav-container fixed'>
          <ul className='topnav max-screen-width'>
            <li>
              <button className='button-inverted new-invoice-nav-button' id='cancel-invoice-button' onClick={() => window.confirm('Are you sure you want to cancel invoice?') && window.history.back()}>CANCEL</button>
            </li>

            <li className='new-invoice-header'>New Invoice</li>

            <li id='new-invoice-nav-save-button-wrapper' className='right' ref={this.moreOptionsRef}>
              <button className='button-inverted new-invoice-nav-button' id='save-invoice-button' onClick={this.handleSaveInvoice}>SAVE</button>
              <button className='button-inverted new-invoice-nav-button' id='more-options-invoice-button' onClick={this.handleToggleMoreOptions}><span className='triangle-down'></span></button>
              {moreOptionsOpen &&
                <div className='dropdown active'>
                  <div className='dropdown-content'>
                    <div className='dropdown-item' onClick={() => window.location.href = emailInvoiceLink(invoice)}>Send<span className='float-right'><FontAwesomeIcon icon={faEnvelope} /></span></div>
                    <div className='dropdown-item' onClick={() => downloadInvoicePdf(invoice)}>Download PDF<span className='float-right'><FontAwesomeIcon icon={faFilePdf} /></span></div>
                  </div>
                </div>
              }
            </li>
          </ul>

          {loading && <div className='loader fixed'></div>}
        </div>

        <div id='new-invoice-form'>
          { errors && errors.length > 0 &&
            <div className='invoice-errors'>
              {errors.map((err, i) => {
                return <div key={i} className='error'><span className='error-icon'><FontAwesomeIcon icon={faExclamationTriangle} /></span>{err}</div>
              })}
            </div>
          }

          <div className='paper-container'>
            <div className='inner-paper-container'>

              <div className='invoice-form-title'>INVOICE</div>

              <div className='invoice-form-bill-from'>
                <div className='invoice-form-bill-from-title invoice-form-section-title'>Bill from</div>

                <input
                  className={'text-input' + (errorMap.payee.name ? ' invalid' : '')}
                  type='text'
                  placeholder='Your name*'
                  value={payee.name}
                  onChange={(e) => this.handleUpdateAgent('payee', 'name', e.target.value)}
                />

                <div className='input-padding input-font-size pr-0'>{payee.email}</div>
              </div>

              <div className='invoice-form-bill-to'>
                <div className='invoice-form-bill-to-title invoice-form-section-title'>Bill to</div>

                <div className='invoice-form-bill-to-content'>
                  <input
                    className={'text-input top-text-input' + (errorMap.payor.name ? ' invalid' : '')}
                    placeholder='Name*'
                    autoComplete='none'
                    value={payor.name || ''}
                    onFocus={() => this.handleToggleDropdown('customerDropdownOpen', true)}
                    onChange={(e) => this.handleUpdateAgent('payor', 'name', e.target.value)}
                  />

                  { customerDropdownOpen &&
                    <div className='dropdown active' id='new-invoice-form-dropdown-menu' ref={this.customerDropdownRef}>
                      <div className='dropdown-content'>
                        { customerDropdownOpen &&
                          customerDropdownOptions
                          .filter(cust => !payor.name || cust.name.toLowerCase().indexOf(payor.name.toLowerCase()) !== -1 )
                          .map(cust => {
                            return (
                              <div className='dropdown-item' key={cust.uuid} onClick={() => this.handleSetPayor(cust)}>
                                { getSpanWithTextHighlighted(cust.name, payor.name) }
                                <div className='dropdown-item-label'>{cust.email}</div>
                              </div>
                            )
                        })}
                      </div>
                    </div>
                  }

                  <input
                    className={'text-input bottom-text-input'  + (errorMap.payor.email ? ' invalid' : '')}
                    placeholder='Email'
                    autoComplete='none'
                    value={payor.email || ''}
                    onChange={(e) => this.handleUpdateAgent('payor', 'email', e.target.value)}
                  />
                </div>

              </div>

              <div className='invoice-form-metadata'>
                <div className='invoice-form-metadata-row input-height'>
                  <div className='invoice-form-metadata-title invoice-form-section-title'>Issued</div>
                  <div className='invoice-form-metadata-content'>
                    <input
                      className={'text-input top-text-input validity' + (errorMap.dateIssued ? ' invalid' : '')}
                      type='date'
                      defaultValue={toUniversalDateFormat(dateIssued)}
                      placeholder='yyyy-mm-dd' // for safari
                      pattern={dateFormatRegex}
                      maxLength={10}
                      onChange={(e) => this.handleUpdateInvoiceProperty('dateIssued', e.target.value)}
                    />
                  </div>
                </div>

                <div className='invoice-form-metadata-row input-height'>
                  <div className='invoice-form-metadata-title invoice-form-section-title'>Due</div>
                  <div className='invoice-form-metadata-content'>
                    <input
                      className={'text-input bottom-text-input validity' + (errorMap.dateDue ? ' invalid' : '')}
                      type='date'
                      defaultValue={toUniversalDateFormat(dateDue)}
                      placeholder='yyyy-mm-dd' // for safari
                      pattern={dateFormatRegex}
                      maxLength={10}
                      onChange={(e) => this.handleUpdateInvoiceProperty('dateDue', e.target.value)}
                    />
                  </div>
                </div>

                <div id='invoice-form-id' className='invoice-form-metadata-row input-height'>
                  <div className='invoice-form-metadata-title invoice-form-section-title'>ID</div>
                  <div className='invoice-form-metadata-content' title={uuid}>
                    {uuid.substring(0, 8)}
                    <span className='hidden-but-copy-pastable-text'>{uuid.substring(8)}</span>
                  </div>
                </div>
              </div>

              <div className='invoice-form-items-section'>
                <div className='invoice-form-items-section-title invoice-form-section-title'>Items</div>
                <div className='invoice-form-currency-selector invoice-form-off-text'>
                  <span className='triangle-down'></span>
                  <select defaultValue={currency} onChange={this.handleChangeCurrency}>
                    {Object.keys(currencySymbolMap).map(currencyOption => {
                      return <option value={currencyOption} key={currencyOption}>{currencyOption}</option>
                    })}
                  </select>
                </div>

                <table className='invoice-form-items-table'>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>

                    { (() => {
                      const chosenProducts = {}
                      for (let i = 0; i < items.length; i++) {
                        chosenProducts[items[i].resourceUuid] = true
                      }

                      return items.map((item, i) => {
                        return (
                          <NewInvoiceFormItemRow
                            key={i}
                            item={item}
                            itemIndex={i}
                            canRemove={items.length > 1}
                            currency={currency}
                            productDropdownOptions={this.state.productDropdownOptions}
                            chosenProducts={chosenProducts}
                            handleRemoveItem={this.handleRemoveItem}
                            handleUpdateItem={this.handleUpdateItem}
                            handleSetItem={this.handleSetItem}
                            errorMap={errorMap.items[item.resourceUuid] || {}}
                          />
                        )
                      })
                    })()}

                    <tr>
                      <td>
                        <input
                          id='add-item-button'
                          className='button'
                          type='button'
                          value='Add an item'
                          onClick={this.handleAddItem}
                        />
                      </td>
                    </tr>

                  </tbody>

                  <tfoot>
                    <tr>
                      <td className='double-border' colSpan='4'></td>
                    </tr>

                    <tr className='input-height'>
                      <td></td>
                      <td className='invoice-form-footer-header' colSpan='2'>Subtotal</td>
                      <td className='invoice-form-footer-value'>
                        <div className='currency-symbol'>{currencySymbolMap[currency]}</div>
                        <div className='invoice-form-item-amount'>{numberToNumberString(subtotal)}</div>
                      </td>
                    </tr>

                    <tr id='discount-input-row' className='input-height'>
                      <td></td>
                      <td className='invoice-form-footer-header' colSpan='2'>Discount</td>
                      <td className='invoice-form-footer-value'>
                        <div className='currency-symbol input-height'>{currencySymbolMap[currency]}</div>
                        <input
                          className={'text-input invoice-form-footer-property-input validity' + ((Number(discount) >= 0 && !errorMap.discount) ? '' : ' invalid')}
                          type='number'
                          min='0'
                          step='any'
                          value={discount}
                          onChange={(e) => this.handleUpdateInvoiceProperty('discount', e.target.value)}
                        />
                      </td>
                    </tr>

                    <tr className='input-height'>
                      <td></td>
                      <td className='invoice-form-footer-header' colSpan='2'>
                        <span id='invoice-form-tax-header' ref={this.taxWrapperRef} onClick={this.handleOpenTaxEditor}>
                          <span style={{ paddingRight: '8px' }}>Tax</span>
                          <span className='invoice-form-off-text'>
                            (
                            <span className={'dotted-border-bottom' + ((Number(taxPercent) >= 0 && !errorMap.taxPercent) ? '' : ' invalid')}>
                              {editingTax
                                ? <input
                                  id='invoice-form-tax-input'
                                  className={'input-no-style validity' + ((Number(taxPercent) >= 0 && !errorMap.taxPercent) ? '' : ' invalid')}
                                  type='number'
                                  min='0'
                                  step='any'
                                  onChange={(e) => this.handleUpdateInvoiceProperty('taxPercent', e.target.value)}
                                  value={taxPercent}
                                />
                                : taxPercent
                              }
                              %
                            </span>
                            )
                          </span>
                        </span>
                      </td>
                      <td className='invoice-form-footer-value'>
                        <div className='currency-symbol'>{currencySymbolMap[currency]}</div>
                        <div className='invoice-form-item-amount'>{numberToNumberString(tax)}</div>
                      </td>
                    </tr>

                    <tr id='shipping-input-row' className='input-height'>
                      <td></td>
                      <td className='invoice-form-footer-header' colSpan='2'>Shipping</td>
                      <td className='invoice-form-footer-value'>
                        <div className='currency-symbol input-height'>{currencySymbolMap[currency]}</div>
                        <input
                          className={'text-input validity invoice-form-footer-property-input' + ((Number(shipping) >= 0 && !errorMap.shipping) ? '' : ' invalid')}
                          type='number'
                          min='0'
                          step='any'
                          value={shipping}
                          onChange={(e, elm) => this.handleUpdateInvoiceProperty('shipping', e.target.value, e, elm)}
                        />
                      </td>
                    </tr>

                    <tr id='invoice-form-final-row' className='bold'>
                      <td id='invoice-form-note'>
                        <textarea className='text-input' placeholder='Note' onChange={(e, elm) => this.handleUpdateInvoiceProperty('note', e.target.value, e, elm)}></textarea>
                      </td>
                      <td className='invoice-form-footer-header input-height' colSpan='2'>Total</td>
                      <td className='invoice-form-footer-value input-height'>
                        <div className='currency-symbol'>{currencySymbolMap[currency]}</div>
                        <div className='invoice-form-item-amount'>{numberToNumberString(total)}</div>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div id='mobile-save-more-buttons' ref={this.mobileMoreOptionsRef}>
                  <button className='button-inverted' onClick={this.handleSaveInvoice}>SAVE</button>
                  <div id='mobile-more-button' className={'input-height' + (moreOptionsOpen ? ' active' : '')} onClick={this.handleToggleMoreOptions}>More options</div>
                  { moreOptionsOpen &&
                    <div>
                      <button className='button-inverted' style={{ marginBottom: '1em' }} onClick={() => window.location.href = emailInvoiceLink(invoice)}>Send<FontAwesomeIcon style={{marginLeft: '.5em'}} icon={faEnvelope} /></button>
                      <button className='button-inverted' onClick={() => downloadInvoicePdf(invoice)}>Download PDF<FontAwesomeIcon style={{marginLeft: '.5em'}} icon={faFilePdf} /></button>
                    </div>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }
}

NewInvoiceForm.propTypes = {
  user: object,
  sqlJsDb: object
}
