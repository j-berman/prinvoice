import React, { Component } from 'react'
import { func, string } from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle'
import './UserForm.css'

export default class UserForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      username: this.props.lastUsedUsername,
      password: '',
      error: undefined,
      loading: false
    }
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

  handleSubmitForm = async (event) => {
    const { mode, handleSignIn } = this.props
    const { username, password, loading } = this.state
    event.preventDefault()

    if (loading) return
    this.setState({ loading: true, error: undefined })

    try {
      const user = await (mode === 'sign-up'
        ? window.userbase.signUp({ username, password, rememberMe: 'local', email: username })
        : window.userbase.signIn({ username, password, rememberMe: 'local' })
      )

      await handleSignIn(user)
    } catch (e) {
      this.setState({ error: e.message, loading: false })
    }
  }

  handleForgotPassword = async () => {
    const { username, loading } = this.state
    if (loading) return

    this.setState({ loading: true })

    try {
      await window.userbase.forgotPassword({ username })
      window.alert('Check your email!')
      this.setState({ loading: false })
    } catch (e) {
      this.setState({ error: e.message, loading: false })
    }
  }

  render() {
    const { username, password, error, loading } = this.state
    const { mode } = this.props

    const disabled = !username || !password

    return (
      <div>
        <div className='UserFormTitle'>
          <h1 style={{ marginBottom: '20px' }}>Prinvoice</h1>
          <h3 style={{ margin: '0' }}>Secure, private, beautiful invoices.</h3>
        </div>

        <div className='OuterUserForm'>
          <div className='container UserForm'>
            <form onSubmit={this.handleSubmitForm}>

              <div style={{ marginTop: '1em' }}>
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

              <div style={{ marginTop: '1em' }}>
                <input
                  className='text-input'
                  type='password'
                  name='password'
                  autoComplete='new-password'
                  onChange={this.handleInputChange}
                  placeholder='Password'
                />
              </div>

              { mode === 'sign-up' &&
                <div style={{ marginTop: '1em' }}>
                  <div className='UserFormPasswordWarning'>
                    <p style={{ textAlign: 'justify' }}>
                      <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '.5em', color: '#66bbae' }} />
                      Save your password in a safe place, such as a <a href='https://bitwarden.com/products/' target='_blank' rel='noopener noreferrer'>password manager</a>.
                      You are the only person in the world who can access your invoices.
                      If you forget your password and lose your device, no one in the world
                      can recover your invoices.
                    </p>
                  </div>
                </div>
              }

              <div style={{ marginTop: '1em' }}>
                <input
                  className='button'
                  type='submit'
                  value={mode === 'sign-up' ? 'Sign Up' : 'Sign In'}
                  disabled={disabled}
                />
              </div>

              <div style={{ marginTop: '1em', minHeight: '1em', lineHeight: '1em' }}>
                { loading && <div style={{ paddingTop: '.35rem' }}><div className='loader'></div></div>}
                { error && <div className='error' >{error}</div>}
              </div>

              { mode === 'sign-in' &&
                <div style={{ marginTop: '1em' }}>
                  <p style={{ width: 'fit-content', margin: 'auto', cursor: 'pointer' }} onClick={this.handleForgotPassword}>Forgot password?</p>
                </div>
              }

              <div style={{ marginTop: '1em' }}>
                { mode === 'sign-up'
                  ? <div>Already have an account? <a href='#sign-in'>Sign in</a></div>
                  : <div>Or, <a href='#sign-up'>create an account</a></div>
                }
              </div>
            </form>
          </div>
        </div>

      </div>
    )
  }
}

UserForm.propTypes = {
  mode: string,
  lastUsedUsername: string,
  handleSignIn: func
}
