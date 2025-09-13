import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/app/Dashboard'
import { Settings } from './pages/app/Settings'

function App() {

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )

}

export default App
