import React, { Component } from 'react'
import UserForm from './components/UserForm/UserForm.js'
import NavBar from './components/NavBar/NavBar.js'
import NewInvoiceForm from './components/NewInvoiceForm/NewInvoiceForm.js'
import { USERBASE_APP_ID } from './config'
import { init, restoreFromBackupFile } from './database/init'
import InvoicesDashboard from './components/InvoicesDashboard/InvoicesDashboard'
import CustomersDashboard from './components/CustomersDashboard/CustomersDashboard'
import Dashboard from './components/Dashboard/Dashboard'
import { hasCreatedInvoice } from './components/Dashboard/logic'
import Account from './components/Account/Account'
import { downloadFileLocally, importFile } from './utils.js'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mode: undefined,
      user: undefined,
      lastUsedUsername: undefined,
      sqlJsDb: undefined
    }
  }

  async componentDidMount() {
    window.addEventListener('hashchange', this.handleReadHash, false)

    try {
      const session = await window.userbase.init({ appId: USERBASE_APP_ID, updateUserHandler: this.handleSetUser })

      // check if user is signed in
      if (session.user) await this.loadData()

      this.setState({ ...session })
    } catch (e) {
      try {
        await window.userbase.signOut()
      } catch {
        // swallow error
      }

      localStorage.clear()

      console.error(e)
      window.alert('Oops! Something went wrong. Please refresh the page.\n\nIf the issue persists, please contact support@prinvoice.com.')
    }

    this.handleReadHash()
  }

  loadData = async () => {
    const changeHandler = ({ db }) => this.setState({ sqlJsDb: db })
    await init(changeHandler)
  }

  handleSignIn = async (user) => {
    await this.loadData()
    this.setState({ user })
    window.location.hash = ''
  }

  handleSetUser = (userResult) => {
    const { user } = userResult
    this.setState({ user })
  }

  handleResetState = (lastUsedUsername) => {
    this.setState({
      lastUsedUsername,
      user: undefined,
      sqlJsDb: undefined,
      mode: undefined
    })
    window.location.hash = 'sign-in'
  }

  handleUpdateUser = (user) => {
    this.setState({ user })
  }

  getDefaultSignedInMode = () => {
    const { sqlJsDb } = this.state
    if (!sqlJsDb) return
    return this.setState({ mode: hasCreatedInvoice(sqlJsDb) ? 'dashboard': 'invoices' })
  }

  handleReadHash = () => {
    const { user } = this.state
    const signedIn = !!user

    const hashRoute = window.location.hash.substring(1)

    switch (hashRoute) {
      case 'sign-up':
      case 'sign-in':
        // if user is signed in already, re-route to default
        return signedIn ? window.location.hash = '' : this.setState({ mode: hashRoute })

      case 'dashboard':
      case 'invoices':
      case 'customers':
      case 'new-invoice':
      case 'account':
        return signedIn ? this.setState({ mode: hashRoute }) : window.location.hash = 'sign-in'

      default: {
        if (signedIn && hashRoute === '') {
          // default mode when user is signed in
          return this.getDefaultSignedInMode()
        } else if (signedIn) {
          // user is signed in but on a route other than '', so re-route to ''
          return window.location.hash = ''
        } else {
          return window.location.hash = 'sign-in'
        }
      }
    }
  }

  handleDownloadData = () => {
    const { sqlJsDb } = this.state
    const data = sqlJsDb.export()
    const filename = `Prinvoice_backup-${new Date().toLocaleDateString()}.db`
    const file = new File([data], filename, { type: 'application/vnd.sqlite3' })
    downloadFileLocally(file)
  }

  handleImportData = () => {
    const fileExtension = navigator.userAgent.match('CriOS')
      ? '' // accept any file type for Chrome iOS given issue in downloadFileLocally
      : '.db'

    importFile(fileExtension, this.handleImportedFile)
  }

  handleImportedFile = async (file) => {
    const { restoringFromBackupFile, user } = this.state
    if (restoringFromBackupFile) return

    this.setState({ restoringFromBackupFile: true })

    try {
      await restoreFromBackupFile(file, user.userId)
      this.setState({ restoringFromBackupFile: false })
    } catch (e) {
      window.alert(`Failed to restore from backup: ${e.message}`)
      this.setState({ restoringFromBackupFile: false })
    }
  }

  render() {
    const {
      user,
      lastUsedUsername,
      sqlJsDb,
      mode
    } = this.state

    const loading = mode === undefined

    return (
      <div>
        { loading &&
          <div className='centered' style={{ top: '40%', width: '40%' }}><div className='loader'></div></div>
        }

        { (user && mode !== 'new-invoice') &&
          <NavBar
            key={'NavBar' + mode} // re-renders on mode change
            mode={mode}
            user={user}
            handleDownloadData={this.handleDownloadData}
            handleImportData={this.handleImportData}
            handleResetState={this.handleResetState}
          />
        }

        { mode && (() => {
          switch (mode) {
            case 'sign-up':
            case 'sign-in':
              return <UserForm
                key={'UserForm' + mode} // re-renders on mode change
                mode={mode}
                lastUsedUsername={mode === 'sign-in' ? lastUsedUsername : ''}
                handleSignIn={this.handleSignIn}
              />

            case 'new-invoice':
              return <NewInvoiceForm
                user={user}
                sqlJsDb={sqlJsDb}
              />

            case 'invoices':
              return <InvoicesDashboard
                key={Math.random()} // re-renders on change to sqlJsDb
                user={user}
                sqlJsDb={sqlJsDb}
              />

            case 'customers':
              return <CustomersDashboard
                key={Math.random()} // re-renders on change to sqlJsDb
                user={user}
                sqlJsDb={sqlJsDb}
              />

            case 'account':
              return <Account
                user={user}
                sqlJsDb={sqlJsDb}
                handleResetState={this.handleResetState}
              />

            case 'dashboard':
            default:
              return <Dashboard
                key={Math.random()} // re-renders on change to sqlJsDb
                user={user}
                sqlJsDb={sqlJsDb}
              />
          }
        })()}
      </div>
    )
  }
}

export default App
