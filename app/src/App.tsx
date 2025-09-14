import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { PairingPage } from '@/pages/PairingPage'
import { DevicesPage } from '@/pages/DevicesPage'
import { TestComponents } from '@/test-components'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pairing" element={<PairingPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/test" element={<TestComponents />} />
      </Routes>
    </Router>
  )
}

export default App
