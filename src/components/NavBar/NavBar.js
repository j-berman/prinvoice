import React, { Component } from 'react'
import { string, object, func } from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars'
import { faChartLine } from '@fortawesome/free-solid-svg-icons/faChartLine'
import { faFileAlt } from '@fortawesome/free-regular-svg-icons/faFileAlt'
import { faUsers } from '@fortawesome/free-solid-svg-icons/faUsers'
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload'
import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload'
import './NavBar.css'

export default class NavBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      menuOpen: false
    }

    this.menuWrapperRef = React.createRef()
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  // https://stackoverflow.com/questions/32553158/detect-click-outside-react-component
  handleClickOutside = (e) => {
    const { menuOpen } = this.state
    if (!menuOpen) return
    if (this.menuWrapperRef && !this.menuWrapperRef.current.contains(e.target)) {
      this.setState({ menuOpen: false })
    }
  }

  handleToggleMenu = () => {
    this.setState(state => ({ menuOpen: !state.menuOpen }))
  }

  handleSignOut = async () => {
    const lastUsedUsername = this.props.user && this.props.user.username

    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await window.userbase.signOut()
        this.props.handleResetState(lastUsedUsername)
      } catch {
        // swallow error
      }
    }
  }

  render() {
    const { mode, user } = this.props
    const { menuOpen } = this.state

    return (
      <div className='topnav-container fixed'>

        <ul className='topnav max-screen-width'>

          <li className={'dropdown' + (menuOpen ? ' active': '')} ref={this.menuWrapperRef} id='topnav-dropdown-menu'>
            <div className='dropbtn' onClick={this.handleToggleMenu}><FontAwesomeIcon icon={faBars} /></div>
            <div className='dropdown-content'>
              <div className='dropdown-item' onClick={() => window.location.href = '#account'}><div style={{ textDecoration: 'underline' }}>{user.username}<span className='float-right'><FontAwesomeIcon icon={faUser} /></span></div></div>
              <div className='dropdown-divider' />
              <div className='dropdown-item' onClick={this.props.handleDownloadData}>Download all of your data<span className='float-right'><FontAwesomeIcon icon={faDownload} /></span></div>
              <div className='dropdown-item' onClick={this.props.handleImportData}>Restore your data from download<span style={{ marginLeft: '2em' }} className='float-right'><FontAwesomeIcon icon={faUpload} /></span></div>
              <div className='dropdown-divider' />
              <div className='dropdown-item' onClick={() => window.location.href = 'mailto:support@prinvoice.com'}>Contact support@prinvoice.com</div>
              <div className='dropdown-divider' />
              <div className='dropdown-item dangerous-hover' onClick={this.handleSignOut}>Sign out</div>
            </div>
          </li>

          <li className='desktop-topnav-item'><a className={'topnav-item' + (mode === 'dashboard' ? ' active' : '')} href='#dashboard'>DASHBOARD</a></li>
          <li className='desktop-topnav-item'><a className={'topnav-item' + (mode === 'invoices' ? ' active' : '')} href='#invoices'>INVOICES</a></li>
          <li className='desktop-topnav-item'><a className={'topnav-item' + (mode === 'customers' ? ' active' : '')} href='#customers'>CUSTOMERS</a></li>

          <li className='mobile-nav-bar-items'>
            <button className={'mobile-nav-bar-item ' + (mode === 'dashboard' ? ' active' : '')} onClick={() => window.location.href ='#dashboard'}>
              <FontAwesomeIcon icon={faChartLine} />
            </button>
            <button className={'mobile-nav-bar-item ' + (mode === 'invoices' ? ' active' : '')} onClick={() => window.location.href ='#invoices'}>
              <FontAwesomeIcon icon={faFileAlt} />
            </button>
            <button className={'mobile-nav-bar-item ' + (mode === 'customers' ? ' active' : '')} onClick={() => window.location.href ='#customers'}>
              <FontAwesomeIcon icon={faUsers} />
            </button>
          </li>

          <li id='new-invoice-button-wrapper' className='right'>
            <button className='button-inverted nav-button left-button-with-icon' onClick={() => window.location.href ='#new-invoice'}>NEW INVOICE</button>
            <button className='button-inverted nav-button right-button-with-icon' onClick={() => window.location.href ='#new-invoice'}>

              {/* importing the svg casues flicker in safari/iOS on rerender,just copy pasted the svg */}
              {/* <img className='button-icon' src={newInvoiceIcon} alt='new-invoice'></img> */}
              <svg className='button-icon' width="98" height="116" viewBox="0 0 98 116" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="96.875" height="115.625" transform="translate(0.75 0.125)" fill="#32363c"/>
                <rect x="8.5625" y="14.1875" width="71.875" height="93.75" stroke="#C6C386" strokeWidth="3.125"/>
                <rect x="63.25" y="6.375" width="25" height="25" fill="#32363c"/>
                <line x1="69.5" y1="14.1653" x2="91.375" y2="14.1653" stroke="#C3EEE7" strokeWidth="3.16933"/>
                <path d="M54.3041 69.2584C54.3041 71.3875 53.6479 73.1521 52.3354 74.5521C51.0229 75.9521 49.1854 76.8271 46.8229 77.1771C46.7062 77.1771 46.6479 77.2355 46.6479 77.3521L46.6916 80.5896C46.6916 80.8813 46.5458 81.0271 46.2541 81.0271H44.3291C44.0375 81.0271 43.8916 80.8813 43.8916 80.5896L43.9354 77.4834C43.9354 77.3667 43.877 77.3084 43.7604 77.3084C40.902 77.1625 38.6562 76.3605 37.0229 74.9021C35.3895 73.4146 34.5729 71.4896 34.5729 69.1271V67.7709C34.5729 67.4792 34.7187 67.3334 35.0104 67.3334H36.9791C37.2708 67.3334 37.4166 67.4792 37.4166 67.7709V68.9521C37.4166 70.6438 38.0729 72.0146 39.3854 73.0646C40.727 74.0855 42.5645 74.5959 44.8979 74.5959C46.9979 74.5959 48.602 74.1292 49.7104 73.1959C50.8187 72.2334 51.3729 70.9646 51.3729 69.3896C51.3729 68.3688 51.1104 67.4938 50.5854 66.7646C50.0895 66.0355 49.3166 65.35 48.2666 64.7084C47.2166 64.0667 45.7145 63.323 43.7604 62.4771C41.6604 61.6021 40.0416 60.8438 38.9041 60.2021C37.7958 59.5313 36.877 58.6855 36.1479 57.6646C35.4479 56.6146 35.0979 55.3021 35.0979 53.7271C35.0979 51.3646 35.8416 49.5125 37.3291 48.1709C38.8458 46.8 40.9312 46.0709 43.5854 45.9834C43.702 45.9834 43.7604 45.925 43.7604 45.8084L43.7166 42.4396C43.7166 42.148 43.8625 42.0021 44.1541 42.0021H46.0354C46.327 42.0021 46.4729 42.148 46.4729 42.4396L46.4291 45.9834C46.4291 46.1 46.4875 46.173 46.6041 46.2021C48.9375 46.5813 50.7604 47.4855 52.0729 48.9146C53.4145 50.3438 54.0854 52.1375 54.0854 54.2959V55.2584C54.0854 55.55 53.9395 55.6959 53.6479 55.6959H51.5916C51.3 55.6959 51.1541 55.55 51.1541 55.2584V54.4709C51.1541 52.7792 50.527 51.3938 49.2729 50.3146C48.0187 49.2355 46.2833 48.6959 44.0666 48.6959C42.1125 48.6959 40.6104 49.1188 39.5604 49.9646C38.5104 50.8105 37.9854 52.0355 37.9854 53.6396C37.9854 54.6896 38.2333 55.5646 38.7291 56.2646C39.2541 56.9355 39.9833 57.5334 40.9166 58.0584C41.8791 58.5542 43.352 59.2105 45.3354 60.0271C47.3479 60.9021 48.9666 61.7188 50.1916 62.4771C51.4458 63.2355 52.4375 64.1688 53.1666 65.2771C53.925 66.3563 54.3041 67.6834 54.3041 69.2584Z" fill="#C3EEE7"/>
                <path d="M80.4374 25.1251V3.25014" stroke="#C3EEE7" strokeWidth="3.125"/>
              </svg>
            </button>
          </li>
        </ul>

      </div>
    )
  }
}

NavBar.propTypes = {
  mode: string,
  user: object,
  handleResetState: func,
  handleDownloadData: func,
  handleImportData: func
}
