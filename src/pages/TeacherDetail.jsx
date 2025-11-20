import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { User, MapPin, Calendar, BookOpen, Star, Plus, Trash2, X, Check, Clock, FileText, Edit2, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TeacherDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [teacher, setTeacher] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [lessonPlans, setLessonPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('attendance');
    const [currentUser, setCurrentUser] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState('attendance'); // 'attendance', 'training', 'lesson_plan'
    const [editingRecord, setEditingRecord] = useState(null);

    // Teacher Edit Modal State
    const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
    const [teacherFormData, setTeacherFormData] = useState({
        name: '',
        subjects: [],
        qualifications: '',
        photoUrl: '',
        joinDate: '',
        training: ''
    });
    const [newSubject, setNewSubject] = useState('');
    const [updatingTeacher, setUpdatingTeacher] = useState(false);

    // Form States
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceStatus, setAttendanceStatus] = useState('Present');

    const [trainingTitle, setTrainingTitle] = useState('');

    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonUrl, setLessonUrl] = useState('');

    const [feedbackName, setFeedbackName] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // Fetch Teacher
            const docRef = doc(db, "teachers", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setTeacher({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.log("No such teacher!");
            }

            // Fetch Feedback
            const feedbackQ = query(collection(db, "feedback"), where("teacherId", "==", id));
            const feedbackSnap = await getDocs(feedbackQ);
            setFeedbacks(feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Attendance
            const attendanceQ = query(collection(db, "attendance"), where("teacherId", "==", id));
            const attendanceSnap = await getDocs(attendanceQ);
            const attendanceData = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort client-side to avoid missing index error
            attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setAttendanceRecords(attendanceData);

            // Fetch Lesson Plans
            const lessonQ = query(collection(db, "lessonPlans"), where("teacherId", "==", id));
            const lessonSnap = await getDocs(lessonQ);
            const lessonData = lessonSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort client-side
            lessonData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setLessonPlans(lessonData);

        } catch (error) {
            console.error("Error fetching data:", error);
            // alert("Error loading data. Check console for details."); // Optional: don't spam user
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackName || !feedbackComment) return;
        try {
            await addDoc(collection(db, "feedback"), {
                teacherId: id,
                name: feedbackName,
                rating: feedbackRating,
                comment: feedbackComment,
                date: new Date().toISOString()
            });
            setFeedbacks([...feedbacks, { teacherId: id, name: feedbackName, rating: feedbackRating, comment: feedbackComment, date: new Date().toISOString() }]);
            setFeedbackName('');
            setFeedbackComment('');
            setFeedbackRating(5);
        } catch (error) {
            console.error("Error adding feedback:", error);
        }
    };

    const handleDeleteFeedback = async (feedbackId) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            try {
                await deleteDoc(doc(db, "feedback", feedbackId));
                setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
            } catch (error) {
                console.error("Error deleting feedback:", error);
                alert("Failed to delete review. Please try again.");
            }
        }
    };

    const handleOpenEditTeacher = () => {
        setTeacherFormData({
            name: teacher.name || '',
            subjects: teacher.subjects || (teacher.subject ? [teacher.subject] : []),
            qualifications: teacher.qualifications || '',
            photoUrl: teacher.photoUrl || '',
            joinDate: teacher.joinDate || '',
            training: teacher.training ? teacher.training.join('\n') : ''
        });
        setNewSubject('');
        setIsEditTeacherModalOpen(true);
    };

    const handleUpdateTeacher = async (e) => {
        e.preventDefault();
        setUpdatingTeacher(true);

        try {
            const teacherData = {
                name: teacherFormData.name,
                subjects: teacherFormData.subjects,
                qualifications: teacherFormData.qualifications,
                photoUrl: teacherFormData.photoUrl,
                joinDate: teacherFormData.joinDate,
                training: teacherFormData.training.split('\n').filter(t => t.trim() !== '')
            };

            await updateDoc(doc(db, "teachers", id), teacherData);
            setTeacher({ ...teacher, ...teacherData });
            setIsEditTeacherModalOpen(false);
        } catch (error) {
            console.error("Error updating teacher:", error);
            alert("Failed to update teacher. Please try again.");
        } finally {
            setUpdatingTeacher(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this teacher?")) {
            try {
                await deleteDoc(doc(db, "teachers", id));
                navigate('/');
            } catch (error) {
                console.error("Error deleting teacher:", error);
            }
        }
    };

    const openAddModal = (tab) => {
        setModalTab(tab);
        setEditingRecord(null);
        setAttendanceDate(new Date().toISOString().split('T')[0]);
        setAttendanceStatus('Present');
        setTrainingTitle('');
        setLessonTitle('');
        setLessonUrl('');
        setIsModalOpen(true);
    };

    const openEditAttendance = (record) => {
        setModalTab('attendance');
        setEditingRecord(record);
        setAttendanceDate(record.date);
        setAttendanceStatus(record.status);
        setIsModalOpen(true);
    };

    const handleSaveRecord = async () => {
        try {
            if (modalTab === 'attendance') {
                const recordData = {
                    teacherId: id,
                    date: attendanceDate,
                    status: attendanceStatus
                };

                if (editingRecord) {
                    await updateDoc(doc(db, "attendance", editingRecord.id), recordData);
                    setAttendanceRecords(attendanceRecords.map(r => r.id === editingRecord.id ? { ...r, ...recordData } : r));
                } else {
                    const docRef = await addDoc(collection(db, "attendance"), recordData);
                    setAttendanceRecords([{ id: docRef.id, ...recordData }, ...attendanceRecords]);
                }
            } else if (modalTab === 'training') {
                const trainingData = [...(teacher.training || []), trainingTitle];
                await updateDoc(doc(db, "teachers", id), { training: trainingData });
                setTeacher({ ...teacher, training: trainingData });
            } else if (modalTab === 'lesson_plan') {
                const lessonData = {
                    teacherId: id,
                    title: lessonTitle,
                    url: lessonUrl || '#',
                    date: new Date().toISOString().split('T')[0]
                };
                const docRef = await addDoc(collection(db, "lessonPlans"), lessonData);
                setLessonPlans([{ id: docRef.id, ...lessonData }, ...lessonPlans]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving record:", error);
            alert("Failed to save record.");
        }
    };

    // --- Stats Calculations ---
    const attendanceScore = useMemo(() => {
        if (attendanceRecords.length === 0) return 0;
        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        return Math.round((presentCount / attendanceRecords.length) * 100);
    }, [attendanceRecords]);

    const feedbackScore = useMemo(() => {
        if (feedbacks.length === 0) return 0;
        const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        return Math.round((totalRating / feedbacks.length / 5) * 100);
    }, [feedbacks]);

    const trainingScore = useMemo(() => {
        const count = teacher?.training?.length || 0;
        return Math.min(Math.round((count / 5) * 100), 100); // Target: 5
    }, [teacher]);

    const lessonScore = useMemo(() => {
        const count = lessonPlans.length;
        return Math.min(Math.round((count / 10) * 100), 100); // Target: 10
    }, [lessonPlans]);

    const performanceData = [
        { name: 'Attendance', value: attendanceScore, color: '#84cc16' }, // Lime
        { name: 'Feedback', value: feedbackScore, color: '#ef4444' },   // Red
        { name: 'Training', value: trainingScore, color: '#f97316' },   // Orange
        { name: 'Lesson Plans', value: lessonScore, color: '#eab308' } // Yellow
    ];

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
    if (!teacher) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Teacher not found.</div>;

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
            {/* Top Section Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>

                {/* 1. Profile Sidebar */}
                <div className="card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', padding: '4px', marginBottom: '1rem' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {teacher.photoUrl ? <img src={teacher.photoUrl} alt={teacher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={64} color="var(--text-muted)" />}
                        </div>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{teacher.name}</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.join(', ') : teacher.subject}, {teacher.qualifications}
                    </p>

                    {currentUser && (
                        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleOpenEditTeacher}>Edit Profile</button>
                            <button className="btn btn-danger" style={{ flex: 1, backgroundColor: '#fee2e2', color: '#ef4444', border: 'none' }} onClick={handleDelete}>Delete</button>
                        </div>
                    )}
                </div>

                {/* 2. Performance Overview (Donut Chart) */}
                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ width: '100%', textAlign: 'left', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Performance Overview</h3>
                    <div style={{ width: '200px', height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={performanceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={0}
                                    dataKey="value"
                                >
                                    {performanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Latest Reviews */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Latest Reviews</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {feedbacks.length > 0 ? feedbacks.slice(0, 3).map((fb, idx) => (
                            <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fb.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} fill={i < fb.rating ? "gold" : "none"} stroke={i < fb.rating ? "gold" : "#cbd5e1"} />
                                            ))}
                                        </div>
                                        {currentUser && fb.id && (
                                            <button
                                                onClick={() => handleDeleteFeedback(fb.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--danger)',
                                                    padding: '0.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    opacity: 0.6,
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                                title="Delete Review"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{fb.comment}"</p>
                            </div>
                        )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reviews yet.</p>}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Tabs & Content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>

                {/* Left: Feedback Form */}
                <div className="card" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Submit Feedback</h3>
                    <form onSubmit={handleFeedbackSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rating</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFeedbackRating(star)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        <Star size={24} fill={star <= feedbackRating ? "gold" : "none"} stroke={star <= feedbackRating ? "gold" : "#cbd5e1"} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Name</label>
                            <input type="text" className="input" value={feedbackName} onChange={e => setFeedbackName(e.target.value)} placeholder="John Doe" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Comments</label>
                            <textarea className="input" rows="4" value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} placeholder="Share your experience..." required style={{ resize: 'vertical' }}></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Review</button>
                    </form>
                </div>

                {/* Right: Tabs Content */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', gridColumn: 'span 2' }}>
                    {/* Tab Headers */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
                        {['attendance', 'training', 'lesson_plans'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '1.5rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Tab Body */}
                    <div style={{ padding: '2rem' }}>
                        {activeTab === 'attendance' && (
                            <div className="animate-fade-in">
                                {currentUser && (
                                    <button
                                        onClick={() => openAddModal('attendance')}
                                        style={{
                                            width: '100%',
                                            border: '2px dashed var(--border)',
                                            borderRadius: 'var(--radius)',
                                            padding: '2rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            background: 'none',
                                            marginBottom: '2rem'
                                        }}
                                    >
                                        <div style={{ padding: '0.5rem', borderRadius: '50%', border: '2px solid var(--text-muted)' }}><Plus size={24} /></div>
                                        <span style={{ fontWeight: '600' }}>Log Attendance</span>
                                    </button>
                                )}

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {attendanceRecords.map((record, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: record.status === 'Present' ? '#10b981' : record.status === 'Absent' ? '#ef4444' : '#f59e0b' }}></div>
                                                <span style={{ fontWeight: '500' }}>{record.date}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    backgroundColor: record.status === 'Present' ? '#d1fae5' : record.status === 'Absent' ? '#fee2e2' : '#fef3c7',
                                                    color: record.status === 'Present' ? '#065f46' : record.status === 'Absent' ? '#991b1b' : '#92400e'
                                                }}>
                                                    {record.status}
                                                </span>
                                                {currentUser && (
                                                    <button onClick={() => openEditAttendance(record)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'training' && (
                            <div className="animate-fade-in">
                                {currentUser && (
                                    <button
                                        onClick={() => openAddModal('training')}
                                        className="btn btn-outline"
                                        style={{ marginBottom: '1.5rem', width: '100%' }}
                                    >
                                        <Plus size={18} /> Add Training Record
                                    </button>
                                )}
                                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
                                    {teacher.training && teacher.training.length > 0 ? teacher.training.map((t, i) => (
                                        <li key={i} style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Check size={20} color="var(--success)" />
                                            {t}
                                        </li>
                                    )) : <p style={{ color: 'var(--text-muted)' }}>No training records found.</p>}
                                </ul>
                            </div>
                        )}
                        {activeTab === 'lesson_plans' && (
                            <div className="animate-fade-in">
                                {currentUser && (
                                    <button
                                        onClick={() => openAddModal('lesson_plan')}
                                        className="btn btn-outline"
                                        style={{ marginBottom: '1.5rem', width: '100%' }}
                                    >
                                        <Plus size={18} /> Upload Lesson Plan
                                    </button>
                                )}

                                {lessonPlans.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {lessonPlans.map(plan => (
                                            <div key={plan.id} style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <FileText size={24} color="var(--primary)" />
                                                    <div>
                                                        <div style={{ fontWeight: '600' }}>{plan.title}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.date}</div>
                                                    </div>
                                                </div>
                                                <a href={plan.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                                                    <Download size={16} /> View
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <p>No lesson plans uploaded yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Record Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>{editingRecord ? 'Edit Record' : 'Add New Record'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div style={{ display: 'flex', backgroundColor: 'var(--background)', padding: '0.25rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
                            {['attendance', 'training', 'lesson_plan'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setModalTab(tab)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: 'none',
                                        borderRadius: 'var(--radius)',
                                        backgroundColor: modalTab === tab ? 'white' : 'transparent',
                                        color: modalTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
                                        fontWeight: modalTab === tab ? '600' : '400',
                                        boxShadow: modalTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        {modalTab === 'attendance' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Date</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="date"
                                            className="input"
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Status</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {['Present', 'Late', 'Absent'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setAttendanceStatus(status)}
                                                style={{
                                                    flex: 1,
                                                    padding: '1rem',
                                                    borderRadius: 'var(--radius)',
                                                    border: attendanceStatus === status ? `2px solid ${status === 'Present' ? '#10b981' : status === 'Late' ? '#f59e0b' : '#ef4444'}` : '1px solid var(--border)',
                                                    backgroundColor: attendanceStatus === status ? (status === 'Present' ? '#ecfdf5' : status === 'Late' ? '#fffbeb' : '#fef2f2') : 'white',
                                                    color: attendanceStatus === status ? (status === 'Present' ? '#047857' : status === 'Late' ? '#b45309' : '#b91c1c') : 'var(--text-main)',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {modalTab === 'training' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Training Title</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={trainingTitle}
                                        onChange={(e) => setTrainingTitle(e.target.value)}
                                        placeholder="e.g. Advanced Pedagogy Workshop"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        )}

                        {modalTab === 'lesson_plan' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Lesson Title</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={lessonTitle}
                                        onChange={(e) => setLessonTitle(e.target.value)}
                                        placeholder="e.g. Algebra 101"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Document URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        value={lessonUrl}
                                        onChange={(e) => setLessonUrl(e.target.value)}
                                        placeholder="https://example.com/lesson-plan.pdf"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveRecord}>
                                Save Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {isEditTeacherModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Edit Teacher Profile</h2>
                            <button onClick={() => setIsEditTeacherModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTeacher} style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Full Name</label>
                                <input type="text" className="input" value={teacherFormData.name} onChange={e => setTeacherFormData({ ...teacherFormData, name: e.target.value })} required placeholder="e.g. Jane Doe" />
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
                                                    setTeacherFormData({ ...teacherFormData, subjects: [...teacherFormData.subjects, newSubject.trim()] });
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
                                                setTeacherFormData({ ...teacherFormData, subjects: [...teacherFormData.subjects, newSubject.trim()] });
                                                setNewSubject('');
                                            }
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {teacherFormData.subjects.map((sub, index) => (
                                        <span key={index} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {sub}
                                            <button
                                                type="button"
                                                onClick={() => setTeacherFormData({ ...teacherFormData, subjects: teacherFormData.subjects.filter((_, i) => i !== index) })}
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
                                <input type="text" className="input" value={teacherFormData.qualifications} onChange={e => setTeacherFormData({ ...teacherFormData, qualifications: e.target.value })} placeholder="e.g. PhD in Physics" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Photo URL</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexDirection: 'column' }}>
                                    <input
                                        type="url"
                                        className="input"
                                        value={teacherFormData.photoUrl}
                                        onChange={e => setTeacherFormData({ ...teacherFormData, photoUrl: e.target.value })}
                                        placeholder="https://example.com/photo.jpg"
                                        style={{ width: '100%' }}
                                    />
                                    {teacherFormData.photoUrl && (
                                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <img src={teacherFormData.photoUrl} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Preview</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Join Date</label>
                                <input type="date" className="input" value={teacherFormData.joinDate} onChange={e => setTeacherFormData({ ...teacherFormData, joinDate: e.target.value })} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Training & Certifications (One per line)</label>
                                <textarea
                                    className="input"
                                    rows="4"
                                    value={teacherFormData.training}
                                    onChange={e => setTeacherFormData({ ...teacherFormData, training: e.target.value })}
                                    placeholder="Certified Google Educator&#10;Advanced Pedagogy Workshop&#10;First Aid Training"
                                    style={{ resize: 'vertical' }}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsEditTeacherModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={updatingTeacher}>
                                    {updatingTeacher ? 'Updating...' : 'Update Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDetail;
