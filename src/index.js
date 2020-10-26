import React from 'react'
import ReactDOM from 'react-dom'
import BigNumber from 'bignumber.js'
import { defaults } from 'react-chartjs-2'
import './index.css'
import App from './App'

// for arbitrary precision arithmetic
const ROUND_HALF_EVEN = 6
BigNumber.set({ DECIMAL_PLACES: 10, ROUNDING_MODE: ROUND_HALF_EVEN })

defaults.global.defaultFontFamily = 'Barlow'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
