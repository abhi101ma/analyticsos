import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Datasets from './pages/Datasets'
import Metrics from './pages/Metrics'
import SchemaExplorer from './pages/SchemaExplorer'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/schema" element={<SchemaExplorer />} />
      </Routes>
    </Layout>
  )
}

export default App