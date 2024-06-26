import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './views/home.jsx' // Importe o componente Home

import ErrorBoundary from './ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
