import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedStudentRoute from './components/ProtectedStudentRoute';
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
import TeacherDashboard from './pages/TeacherDashboard';
import LessonBuilder from './pages/LessonBuilder';
import ClassroomHost from './pages/ClassroomHost';
import ClassroomStudent from './pages/ClassroomStudent';
import JoinClass from './pages/JoinClass';
import MeetingRoom from './pages/MeetingRoom';

function App() {
    return (
        <AuthProvider>
            <Router>
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
                                <BookSession />
                            </ProtectedStudentRoute>
                        }
                    />

                    {/* Admin routes without Layout */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Teacher/Tutor Routes */}
                    <Route
                        path="/teacher/dashboard"
                        element={
                            <ProtectedRoute>
                                <TeacherDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/lesson/:lessonId"
                        element={
                            <ProtectedRoute>
                                <LessonBuilder />
                            </ProtectedRoute>
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
                    <Route path="/meeting/:bookingId" element={<MeetingRoom />} />

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
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
