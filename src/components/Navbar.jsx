import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';

const Navbar = () => {
    const location = useLocation();
    const auth = getAuth();
    const user = auth.currentUser;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <nav style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <div className="container" style={{ height: '4.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '800', fontSize: '1.5rem', color: 'var(--primary)', textDecoration: 'none' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                        padding: '6px',
                        borderRadius: '8px',
                        color: 'white',
                        display: 'flex'
                    }}>
                        <GraduationCap size={24} />
                    </div>
                    <span style={{ background: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        EduTrack
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/" className={`btn ${location.pathname === '/' ? 'btn-primary' : 'btn-outline'}`} style={{ border: location.pathname === '/' ? 'none' : '1px solid transparent' }}>
                        Teachers
                    </Link>

                    {user ? (
                        <>
                            <Link to="/admin" className={`btn ${location.pathname.startsWith('/admin') ? 'btn-primary' : 'btn-outline'}`} style={{ border: location.pathname.startsWith('/admin') ? 'none' : '1px solid transparent' }}>
                                <LayoutDashboard size={18} />
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} className="btn btn-outline" style={{ border: '1px solid transparent', color: 'var(--danger)' }} title="Logout">
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-outline" style={{ border: '1px solid transparent' }}>
                            <LogIn size={18} />
                            Admin Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
