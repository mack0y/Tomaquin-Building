import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Units from './pages/Units'
import Tenants from './pages/Tenants'
import Payments from './pages/Payments'
import Utilities from './pages/Utilities'
import Cashflow from './pages/Cashflow'
import Reports from './pages/Reports'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="units" element={<Units />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="payments" element={<Payments />} />
        <Route path="utilities" element={<Utilities />} />
        <Route path="cashflow" element={<Cashflow />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
