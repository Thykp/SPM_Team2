import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/app/Dashboard'
import { Settings } from './pages/app/Settings'
import Project from './pages/app/Project'
import ProjectDetail from './pages/app/ProjectDetail'
import ManageUser from './pages/app/ManageUser'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleGate from './components/auth/RoleGate'

function App() {

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Project />} />
          <Route path="project/:projectId" element={<ProjectDetail />} />
          <Route
            path="settings"
            element={
              <RoleGate allow={["Staff", "Manager", "Director", "Senior Management"]}>
                <Settings />
              </RoleGate>
            }
          />
          <Route
            path="manage-users"
            element={
              <RoleGate allow={["Manager", "Director", "Senior Management"]}>
                <ManageUser />
              </RoleGate>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<div className="p-6">Not Found</div>} />
    </Routes>
  )

}

export default App
