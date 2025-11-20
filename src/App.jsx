import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TeacherDetail from './pages/TeacherDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

// Placeholder components for now
const Placeholder = ({ title }) => (
    <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>{title}</h1>
        <p>Coming soon...</p>
    </div>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    return (
        <Router>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <main style={{ flex: 1, padding: '2rem 0' }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/teacher/:id" element={<TeacherDetail />} />
                        <Route path="/login" element={!user ? <AdminLogin /> : <Navigate to="/admin" />} />
                        <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
