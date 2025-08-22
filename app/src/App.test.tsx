import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Provider } from './provider'

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Provider>
          <App />
        </Provider>
      </BrowserRouter>
    )
    // Just verify the app renders without throwing errors
    expect(document.querySelector('body')).toBeInTheDocument()
    // Debug what's actually rendered
    // console.log(screen.debug())
  })
})