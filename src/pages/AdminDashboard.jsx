import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2, Edit, X, Save, User, Users, CheckCircle, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
    const [teachers, setTeachers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('teachers');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        subjects: [],
        qualifications: '',
        photoUrl: '',
        joinDate: '',
        training: ''
    });
    const [uploading, setUploading] = useState(false);
    const [newSubject, setNewSubject] = useState('');

    // Real Attendance Data Calculation
    const [attendanceStats, setAttendanceStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        avg: 0
    });

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const teachersSnapshot = await getDocs(collection(db, "teachers"));
            setTeachers(teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const feedbackSnapshot = await getDocs(collection(db, "feedback"));
            setFeedbacks(feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const attendanceSnapshot = await getDocs(collection(db, "attendance"));
                const allRecords = attendanceSnapshot.docs.map(doc => doc.data());

                // Filter records for currently existing teachers only
                const teacherIds = new Set(teachers.map(t => t.id));
                const validRecords = allRecords.filter(r => teacherIds.has(r.teacherId));

                const total = validRecords.length;
                if (total === 0) {
                    setAttendanceStats({ present: 0, absent: 0, late: 0, avg: 0 });
                    return;
                }

                const present = validRecords.filter(r => r.status === 'Present').length;
                const absent = validRecords.filter(r => r.status === 'Absent').length;
                const late = validRecords.filter(r => r.status === 'Late').length;

                const avg = Math.round(((present + late) / total) * 100);

                setAttendanceStats({ present, absent, late, avg });
            } catch (error) {
                console.error("Error fetching attendance stats:", error);
            }
        };

        if (teachers.length > 0) {
            fetchAttendance();
        }
    }, [teachers]);

    const handleOpenModal = (teacher = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                name: teacher.name || '',
                subjects: teacher.subjects || (teacher.subject ? [teacher.subject] : []),
                qualifications: teacher.qualifications || '',
                photoUrl: teacher.photoUrl || '',
                joinDate: teacher.joinDate || '',
                training: teacher.training ? teacher.training.join('\n') : ''
            });
        } else {
            setEditingTeacher(null);
            setFormData({
                name: '',
                subjects: [],
                qualifications: '',
                photoUrl: '',
                joinDate: '',
                training: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            const teacherData = {
                name: formData.name,
                subjects: formData.subjects,
                qualifications: formData.qualifications,
                photoUrl: formData.photoUrl,
                joinDate: formData.joinDate,
                training: formData.training.split('\n').filter(t => t.trim() !== '')
            };

            if (editingTeacher) {
                await updateDoc(doc(db, "teachers", editingTeacher.id), teacherData);
                setTeachers(teachers.map(t => t.id === editingTeacher.id ? { ...t, ...teacherData } : t));
            } else {
                const docRef = await addDoc(collection(db, "teachers"), teacherData);
                setTeachers([...teachers, { id: docRef.id, ...teacherData }]);
            }

            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving teacher:", error);
            alert("Failed to save teacher. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteTeacher = async (id) => {
        if (window.confirm("Are you sure you want to delete this teacher?")) {
            try {
                await deleteDoc(doc(db, "teachers", id));
                setTeachers(teachers.filter(t => t.id !== id));
            } catch (error) {
                console.error("Error deleting teacher:", error);
            }
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (window.confirm("Are you sure you want to delete this feedback?")) {
            try {
                await deleteDoc(doc(db, "feedback", id));
                setFeedbacks(feedbacks.filter(f => f.id !== id));
            } catch (error) {
                console.error("Error deleting feedback:", error);
            }
        }
    };

    // Calculate stats
    const totalTeachers = teachers.length;
    const avgRating = feedbacks.length > 0
        ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1)
        : '0.0';

    const attendanceData = [
        { name: 'Present', value: attendanceStats.present, color: '#10b981' },
        { name: 'Absent', value: attendanceStats.absent, color: '#ef4444' },
        { name: 'Late', value: attendanceStats.late, color: '#f59e0b' },
    ];

    // Feedback Distribution
    const feedbackDistribution = [1, 2, 3, 4, 5].map(star => ({
        name: `${star} Stars`,
        count: feedbacks.filter(f => f.rating === star).length
    }));

    if (loading) return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            {/* Skeleton Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '300px', height: '40px', background: 'linear-gradient(90deg, var(--background) 0%, #f0f0f0 50%, var(--background) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 'var(--radius)' }}></div>
                <div style={{ width: '150px', height: '20px', background: 'linear-gradient(90deg, var(--background) 0%, #f0f0f0 50%, var(--background) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 'var(--radius)' }}></div>
            </div>
            {/* Skeleton Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(90deg, var(--background) 0%, #f0f0f0 50%, var(--background) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ width: '80px', height: '16px', background: 'linear-gradient(90deg, var(--background) 0%, #f0f0f0 50%, var(--background) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}></div>
                            <div style={{ width: '60px', height: '28px', background: 'linear-gradient(90deg, var(--background) 0%, #f0f0f0 50%, var(--background) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 'var(--radius)' }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingTop: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Administrator Dashboard
                </h1>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Logged in as Admin</div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: '#e0e7ff', color: 'var(--primary)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Total Teachers</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: 1 }}>{totalTeachers}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: '#d1fae5', color: 'var(--success)' }}>
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Avg Attendance</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: 1 }}>{attendanceStats.avg}%</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706' }}>
                        <Star size={32} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Avg Rating</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: 1 }}>{avgRating}</div>
                    </div>
                </div>
            </div>

            {/* Global Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Global Feedback Distribution</h3>
                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={feedbackDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow)' }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Global Attendance Status</h3>
                    <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={attendanceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {attendanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                            {attendanceData.map((entry, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: entry.color }}></div>
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Manage Teachers</h2>
                    <button className="btn btn-outline" onClick={() => handleOpenModal()} style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                        <Plus size={18} />
                        Add New
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setActiveTab('teachers')}
                        style={{
                            paddingBottom: '1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'teachers' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'teachers' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        All Teachers
                    </button>
                    <button
                        onClick={() => setActiveTab('feedback')}
                        style={{
                            paddingBottom: '1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'feedback' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'feedback' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        All Feedback
                    </button>
                </div>

                {/* Teachers List */}
                {activeTab === 'teachers' && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {teachers.map(teacher => (
                            <div key={teacher.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', overflow: 'hidden' }}>
                                        {teacher.photoUrl ? <img src={teacher.photoUrl} alt={teacher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} />}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{teacher.name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {teacher.subjects ? teacher.subjects.join(', ') : teacher.subject}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-outline" onClick={() => handleOpenModal(teacher)} title="Edit" style={{ padding: '0.5rem', border: 'none' }}>
                                        <Edit size={18} color="var(--secondary)" />
                                    </button>
                                    <button className="btn btn-outline" onClick={() => handleDeleteTeacher(teacher.id)} title="Delete" style={{ padding: '0.5rem', border: 'none' }}>
                                        <Trash2 size={18} color="var(--danger)" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Feedback List */}
                {activeTab === 'feedback' && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {feedbacks.map(fb => (
                            <div key={fb.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '1rem' }}>{fb.name}</strong>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--background)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Teacher ID: {fb.teacherId.substring(0, 8)}</span>
                                    </div>
                                    <button className="btn btn-outline" style={{ color: 'var(--danger)', border: 'none', padding: '0.25rem' }} onClick={() => handleDeleteFeedback(fb.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{fb.comment}</p>
                                <div style={{ color: 'gold', fontSize: '0.9rem', display: 'flex', gap: '2px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} style={{ color: i < fb.rating ? 'gold' : '#cbd5e1' }}>★</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Full Name</label>
                                <input type="text" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Jane Doe" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Subjects</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newSubject}
                                        onChange={e => setNewSubject(e.target.value)}
                                        placeholder="e.g. Mathematics"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newSubject.trim()) {
                                                    setFormData({ ...formData, subjects: [...formData.subjects, newSubject.trim()] });
                                                    setNewSubject('');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            if (newSubject.trim()) {
                                                setFormData({ ...formData, subjects: [...formData.subjects, newSubject.trim()] });
                                                setNewSubject('');
                                            }
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {formData.subjects.map((sub, index) => (
                                        <span key={index} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {sub}
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, subjects: formData.subjects.filter((_, i) => i !== index) })}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Qualifications</label>
                                <input type="text" className="input" value={formData.qualifications} onChange={e => setFormData({ ...formData, qualifications: e.target.value })} placeholder="e.g. PhD in Physics" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Photo URL</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexDirection: 'column' }}>
                                    <input
                                        type="url"
                                        className="input"
                                        value={formData.photoUrl}
                                        onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                                        placeholder="https://example.com/photo.jpg"
                                        style={{ width: '100%' }}
                                    />
                                    {formData.photoUrl && (
                                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <img src={formData.photoUrl} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Preview</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Join Date</label>
                                <input type="date" className="input" value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Training & Certifications (One per line)</label>
                                <textarea
                                    className="input"
                                    rows="4"
                                    value={formData.training}
                                    onChange={e => setFormData({ ...formData, training: e.target.value })}
                                    placeholder="Certified Google Educator&#10;Advanced Pedagogy Workshop&#10;First Aid Training"
                                    style={{ resize: 'vertical' }}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                                    <Save size={18} />
                                    {uploading ? 'Saving...' : 'Save Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
