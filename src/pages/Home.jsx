import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User, BookOpen, Star, Award } from 'lucide-react';

const Home = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "teachers"));
                const teachersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTeachers(teachersData);
            } catch (error) {
                console.error("Error fetching teachers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="animate-fade-in" style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '600' }}>Loading faculty directory...</div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '4rem', textAlign: 'center', paddingTop: '2rem' }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2
                }}>
                    Excellence in Education
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                    Discover our dedicated teaching professionals. Track performance, view achievements, and provide valuable feedback.
                </p>
            </header>

            {teachers.length === 0 ? (
                <div className="glass" style={{ textAlign: 'center', padding: '4rem', borderRadius: 'var(--radius)', maxWidth: '600px', margin: '0 auto' }}>
                    <User size={64} style={{ color: 'var(--secondary)', marginBottom: '1.5rem', opacity: 0.5 }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No teachers found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>The directory is currently empty. Admin can add teachers from the dashboard.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
                    {teachers.map(teacher => (
                        <Link to={`/teacher/${teacher.id}`} key={teacher.id} className="card card-hover" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
                                }}>
                                    {teacher.photoUrl ? (
                                        <img src={teacher.photoUrl} alt={teacher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        teacher.name?.charAt(0) || 'T'
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{teacher.name}</h3>
                                    <span className="badge badge-success">
                                        {teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.join(', ') : (teacher.subject || 'General')}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <BookOpen size={18} color="var(--primary)" />
                                    <span>{teacher.qualifications || 'Qualified Teacher'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Star size={18} color="gold" fill="gold" />
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                        {teacher.rating ? `${teacher.rating} / 5` : 'New'}
                                    </span>
                                    <span style={{ fontSize: '0.85rem' }}>Rating</span>
                                </div>
                                {teacher.training && teacher.training.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Award size={18} color="var(--success)" />
                                        <span>{teacher.training.length} Certifications</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                                View Profile →
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
