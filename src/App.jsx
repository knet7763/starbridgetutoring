import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AsyncComponentFallback } from './components/AsyncHelpers';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedStudentRoute from './components/ProtectedStudentRoute';
import ProtectedMeetingRoute from './components/ProtectedMeetingRoute';
import ProtectedTeacherRoute from './components/ProtectedTeacherRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Subjects from './pages/Subjects';
import Tutors from './pages/Tutors';
import Lessons from './pages/Lessons';
import Pricing from './pages/Pricing';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import BookTrial from './pages/BookTrial';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentLogin from './pages/StudentLogin';
import StudentSignup from './pages/StudentSignup';
import StudentDashboard from './pages/StudentDashboard';
import BookSession from './pages/BookSession';
const ClassroomHost = React.lazy(() => import('./pages/ClassroomHost'));
const ClassroomStudent = React.lazy(() => import('./pages/ClassroomStudent'));
const LessonBuilder = React.lazy(() => import('./pages/LessonBuilder'));
const MeetingRoom = React.lazy(() => import('./pages/MeetingRoom'));
import TeacherDashboard from './pages/TeacherDashboard';
import JoinClass from './pages/JoinClass';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <React.Suspense fallback={<AsyncComponentFallback />}>
                    <Routes>
                    {/* Public routes with Layout */}
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/subjects" element={<Layout><Subjects /></Layout>} />
                    <Route path="/tutors" element={<Layout><Tutors /></Layout>} />
                    <Route path="/lessons" element={<Layout><Lessons /></Layout>} />
                    <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
                    <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
                    <Route path="/about" element={<Layout><About /></Layout>} />
                    <Route path="/contact" element={<Layout><Contact /></Layout>} />
                    <Route path="/login" element={<Layout><Login /></Layout>} />
                    <Route path="/book-trial" element={<Layout><BookTrial /></Layout>} />

                    {/* Phase 3: Real booking for authenticated students */}
                    <Route
                        path="/book-session/:tutorId"
                        element={
                            <ProtectedStudentRoute>
                                <Layout><BookSession /></Layout>
                            </ProtectedStudentRoute>
                        }
                    />

                    {/* Admin routes without Layout */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedAdminRoute>
                                <AdminDashboard />
                            </ProtectedAdminRoute>
                        }
                    />

                    {/* Teacher/Tutor Routes */}
                    <Route
                        path="/teacher/dashboard"
                        element={
                            <ProtectedTeacherRoute>
                                <TeacherDashboard />
                            </ProtectedTeacherRoute>
                        }
                    />
                    <Route
                        path="/teacher/lesson/:lessonId"
                        element={
                            <ProtectedTeacherRoute>
                                <LessonBuilder />
                            </ProtectedTeacherRoute>
                        }
                    />

                    {/* Classroom Routes */}
                    <Route
                        path="/classroom/host/:sessionId"
                        element={
                            <ProtectedRoute>
                                <ClassroomHost />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/classroom/join/:sessionId"
                        element={<ClassroomStudent />}
                    />
                    <Route path="/join" element={<JoinClass />} />
                    <Route
                        path="/meeting/:bookingId"
                        element={
                            <ProtectedMeetingRoute>
                                <MeetingRoom />
                            </ProtectedMeetingRoute>
                        }
                    />

                    {/* Student routes without Layout */}
                    <Route path="/student/login" element={<StudentLogin />} />
                    <Route path="/student/signup" element={<StudentSignup />} />
                    <Route
                        path="/student/dashboard"
                        element={
                            <ProtectedStudentRoute>
                                <StudentDashboard />
                            </ProtectedStudentRoute>
                        }
                    />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* 404 catch-all */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                </React.Suspense>
            </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
