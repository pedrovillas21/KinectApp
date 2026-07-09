import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StudentsListPage from './pages/StudentsListPage';
import StudentDetailPage from './pages/StudentDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <StudentsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id"
        element={
          <ProtectedRoute>
            <StudentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/students" replace />} />
    </Routes>
  );
}
