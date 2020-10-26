import React, { Component } from 'react'
import { object, bool, array, func, number, string } from 'prop-types'
import './NewInvoiceForm.css'
import {
  getItemAmount,
} from './logic'
import {
  currencySymbolMap,
  numberToNumberString,
  getSpanWithTextHighlighted,
} from '../../utils'

export default class NewInvoiceFormItemRow extends Component {
  constructor(props) {
    super(props)

    this.state = {
      error: undefined,
      productDropdownOpen: false,
    }

    this.productDropdownRef = React.createRef()
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutsideProductsDropdown)
    document.addEventListener('keydown', this.handleHitEnter)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutsideProductsDropdown)
    document.removeEventListener('keydown', this.handleHitEnter)
  }

  handleClickOutsideProductsDropdown = (e) => {
    const { productDropdownOpen } = this.state
    if (!productDropdownOpen) return
    if (productDropdownOpen && this.productDropdownRef && !this.productDropdownRef.current.contains(e.target)) {
      this.setState({ productDropdownOpen: false })
    }
  }

  handleHitEnter = (e) => {
    const { productDropdownOpen } = this.state
    if (!productDropdownOpen) return
    const ENTER_KEY_CODE = 13
    if (e.key === 'Enter' || e.keyCode === ENTER_KEY_CODE) {
      this.setState({ productDropdownOpen: false })
    }
  }

  handleToggleProductDropdown = () => {
    this.setState({ productDropdownOpen: true })
  }

  handleSetItem = (itemIndex, product) => {
    this.props.handleSetItem(itemIndex, product)
    this.setState({ productDropdownOpen: false })
  }

  render() {
    const {
      item,
      itemIndex,
      currency,
      canRemove,
      productDropdownOptions,
      chosenProducts,
      handleRemoveItem,
      handleUpdateItem,
      errorMap,
    } = this.props
    const {
      productDropdownOpen,
    } = this.state

    return (
      <tr className='invoice-form-item-row'>
        <td>
          {canRemove && <div className='invoice-form-item-row-cancel-button no-select' onClick={() => handleRemoveItem(item.resourceUuid)}>x</div>}
          <input
            className={'text-input item-input' + (errorMap.name ? ' invalid' : '')}
            placeholder='Item name*'
            value={item.name || ''}
            autoComplete='none'
            onFocus={this.handleToggleProductDropdown}
            onChange={(e) => handleUpdateItem(itemIndex, item.resourceUuid, 'name', e.target.value)}
          />

          { productDropdownOpen &&
            <div className='dropdown active' id='new-invoice-form-dropdown-menu' ref={this.productDropdownRef}>
              <div className='dropdown-content'>
                { productDropdownOptions
                  .filter(product => !chosenProducts[product.uuid] && (!item.name || product.name.toLowerCase().indexOf(item.name.toLowerCase()) !== -1 ))
                  .map(product => {
                    return (
                      <div className='dropdown-item' key={product.uuid} onClick={() => this.handleSetItem(itemIndex, product)}>
                        { getSpanWithTextHighlighted(product.name, item.name) }
                        <div className='dropdown-item-label'>{currencySymbolMap[currency]}{numberToNumberString(product.unit_price)}</div>
                      </div>
                    )
                })}
              </div>
            </div>
           }
        </td>
        <td className='invoice-form-quantity-input-row'>
          <input
            className={'text-input quantity-input' + ((Number(item.quantity) > 0 && !errorMap.quantity) ? '' : ' invalid')}
            type='number'
            required
            value={item.quantity}
            onChange={(e) => handleUpdateItem(itemIndex, item.resourceUuid, 'quantity', e.target.value)}
          />
          <span className='invoice-form-multiply-sign'>X</span>
        </td>
        <td className='invoice-form-price-input-row'>
          <span className='invoice-form-price-input-currency-sign'>{currencySymbolMap[currency]}</span>
          <input
            className={'text-input price-input validity' + ((Number(item.unitPrice) >= 0 && !errorMap.unitPrice) ? '' : ' invalid')}
            type='number'
            min='0'
            step='any'
            required
            value={item.unitPrice}
            onChange={(e) => handleUpdateItem(itemIndex, item.resourceUuid, 'unitPrice', e.target.value)}
          />
        </td>
        <td className='invoice-form-item-amount-cell input-height'>
          {canRemove && <span className='invoice-form-delete-item-mobile' onClick={() => handleRemoveItem(item.resourceUuid)}>Remove</span>}
          <span className='currency-symbol'>{currencySymbolMap[currency]}</span>
          <span className='invoice-form-item-amount'>{numberToNumberString(getItemAmount(item))}</span>
        </td>
      </tr>
    )
  }
}

NewInvoiceFormItemRow.propTypes = {
  item: object,
  itemIndex: number,
  canRemove: bool,
  currency: string,
  productDropdownOptions: array,
  chosenProducts: object,
  handleRemoveItem: func,
  handleUpdateItem: func,
  handleSetItem: func,
  errorMap: object,
}
