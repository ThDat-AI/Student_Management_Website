// StudentManagement.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLayout } from '../../../contexts/LayoutContext';
import { Container, Row, Col, Button, Form, Card, Spinner, InputGroup, Alert } from 'react-bootstrap';
import { FaPlus, FaSearch, FaUserGraduate, FaFilter } from 'react-icons/fa';
import api from '../../../api/index';
import { toast } from 'react-toastify';
import { useDebounce } from 'use-debounce';

import confirmDelete from '../../../components/ConfirmDelete';
import StudentModal from './components/StudentModal';
import StudentTable from './components/StudentTable';

const parseApiError = (error) => {
    const errorData = error.response?.data;
    if (!errorData) return "Lỗi không xác định. Vui lòng kiểm tra kết nối mạng.";
    if (errorData.detail) return errorData.detail;
    const firstKey = Object.keys(errorData)[0];
    if (firstKey && Array.isArray(errorData[firstKey]) && errorData[firstKey].length > 0) return errorData[firstKey][0];
    if (Array.isArray(errorData) && errorData.length > 0) return errorData[0];
    return "Thao tác thất bại. Vui lòng thử lại.";
};

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [nienKhoas, setNienKhoas] = useState([]);
    const [khois, setKhois] = useState([]);
    const [isFetchingFilters, setIsFetchingFilters] = useState(true);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    // KEY FIX 1: Khởi tạo state là null để chờ dữ liệu
    const [selectedNienKhoaId, setSelectedNienKhoaId] = useState(null); 
    const [currentNienKhoaId, setCurrentNienKhoaId] = useState(null);
    const [filterKhoi, setFilterKhoi] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const isComponentMountedRef = useRef(true);
    const { setPageTitle } = useLayout();
    const isViewingCurrentNienKhoa = selectedNienKhoaId === currentNienKhoaId && !!selectedNienKhoaId;

    useEffect(() => {
        isComponentMountedRef.current = true;
        document.title = "Quản lý học sinh";
        setPageTitle("Quản lý học sinh");
        return () => { isComponentMountedRef.current = false; };
    }, [setPageTitle]);

    useEffect(() => {
        const fetchFilters = async () => {
            setIsFetchingFilters(true);
            try {
                const [nienKhoasRes, khoisRes] = await Promise.all([
                    api.get('/api/students/filters/nienkhoa/'), 
                    api.get('/api/students/filters/khoi/'),     
                ]);
                if (!isComponentMountedRef.current) return;
                
                const fetchedNienKhoas = nienKhoasRes.data;
                setNienKhoas(fetchedNienKhoas);
                setKhois(khoisRes.data);
                
                // KEY FIX 2: Tìm và tự động chọn niên khóa hiện hành
                const current = fetchedNienKhoas.find(nk => nk.is_current);
                if (current) {
                    setCurrentNienKhoaId(current.id);
                    setSelectedNienKhoaId(current.id);
                } else if (fetchedNienKhoas.length > 0) {
                    // Fallback: chọn niên khóa đầu tiên nếu không có niên khóa hiện hành
                    setSelectedNienKhoaId(fetchedNienKhoas[0].id);
                }
            } catch (err) {
                if (isComponentMountedRef.current) toast.error("Không thể tải dữ liệu cần thiết cho trang.");
            } finally {
                if (isComponentMountedRef.current) setIsFetchingFilters(false);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        // Chỉ fetch khi đã có selectedNienKhoaId
        if (!selectedNienKhoaId) {
            setStudents([]);
            return;
        }
        const fetchStudents = async () => {
            setIsFetchingStudents(true);
            try {
                const params = { search: debouncedSearchTerm, nien_khoa_id: selectedNienKhoaId, khoi_id: filterKhoi || null };
                const res = await api.get('/api/students/hocsinh/', { params });
                if (isComponentMountedRef.current) setStudents(res.data);
            } catch (err) {
                if (isComponentMountedRef.current) {
                    toast.error("Không thể tải danh sách học sinh.");
                    setStudents([]);
                }
            } finally {
                if (isComponentMountedRef.current) setIsFetchingStudents(false);
            }
        };
        fetchStudents();
    }, [debouncedSearchTerm, filterKhoi, selectedNienKhoaId]);
    
    const handleShowModal = (type, student = null) => {
        setModalType(type);
        setSelectedStudent(student);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedStudent(null);
    };
    
    const handleSubmitInModal = async (formData, studentId) => {
        let payload;
        if (modalType === 'create') {
            payload = { ...formData, IDNienKhoaTiepNhan: currentNienKhoaId, KhoiDuKien: Number(formData.KhoiDuKien) };
        } else {
            payload = { ...formData, KhoiDuKien: Number(formData.KhoiDuKien) };
        }
        
        const originalStudents = students;
        let tempId = `temp-${Date.now()}`;
        if (modalType === 'create') {
            const tempStudent = { ...payload, id: tempId, is_deletable: true, _isOptimistic: true, TenNienKhoaTiepNhan: nienKhoas.find(nk => nk.id === payload.IDNienKhoaTiepNhan)?.TenNienKhoa, TenKhoiDuKien: khois.find(k => k.id === payload.KhoiDuKien)?.TenKhoi };
            setStudents(prev => [tempStudent, ...prev]);
        } else {
            tempId = studentId;
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...payload, _isOptimistic: true } : s));
        }

        try {
            let res;
            if (modalType === 'create') {
                res = await api.post('/api/students/hocsinh/', payload);
            } else {
                res = await api.patch(`/api/students/hocsinh/${studentId}/`, payload);
            }

            if (isComponentMountedRef.current) {
                setStudents(prev => prev.map(s => (s.id === tempId ? res.data : s)));
                toast.success(modalType === 'create' ? 'Thêm học sinh thành công!' : 'Cập nhật thành công!');
                handleCloseModal();
            }
        } catch (err) {
            if (isComponentMountedRef.current) {
                toast.error(parseApiError(err));
                setStudents(originalStudents); // Rollback
            }
        }
    };

    const handleDelete = async (student) => {
        if (!isViewingCurrentNienKhoa || !student.is_deletable) {
            toast.warn("Không thể xóa học sinh này.");
            return;
        }
        const isConfirmed = await confirmDelete(`Bạn có chắc muốn xóa học sinh "${student.Ho} ${student.Ten}"?`);
        if (!isConfirmed) return;
        const originalStudents = students;
        setStudents(prev => prev.filter(s => s.id !== student.id));
        try {
            await api.delete(`/api/students/hocsinh/${student.id}/`);
            toast.success('Xóa học sinh thành công!');
        } catch (err) {
            toast.error(parseApiError(err));
            setStudents(originalStudents);
        }
    };
    
    // KEY FIX 3: Hiển thị một spinner duy nhất trong khi khởi tạo
    if (isFetchingFilters) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" variant="primary" />
                <p className="ms-3 mb-0 text-muted">Đang tải cấu hình...</p>
            </Container>
        );
    }
    
    return (
        <Container fluid className="py-4">
            <Row className="justify-content-between align-items-center mb-4">
                <Col xs={12} md={6} lg={4}>
                    <h2 className="h4 mb-2 mb-md-0 d-flex align-items-center">
                        <FaUserGraduate className="me-2 text-primary" /> Quản lý học sinh
                    </h2>
                </Col>
                <Col xs={12} md={6} lg={8} className="d-flex flex-wrap justify-content-end gap-2">
                    <InputGroup style={{ maxWidth: '300px' }}>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control type="search" placeholder="Tìm theo tên, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </InputGroup>
                    {/* KEY FIX 4: value sẽ là `selectedNienKhoaId || ''` để xử lý trường hợp null ban đầu */}
                    <Form.Select style={{ maxWidth: '240px' }} value={selectedNienKhoaId || ''} onChange={(e) => setSelectedNienKhoaId(Number(e.target.value) || '')}>
                        {/* Không cần option "chọn niên khóa" nữa */}
                        {nienKhoas.map(nk => (<option key={nk.id} value={nk.id}>{nk.TenNienKhoa}{nk.is_current ? ' (Hiện hành)' : ''}</option>))}
                    </Form.Select>
                    <Form.Select style={{ maxWidth: '220px' }} value={filterKhoi} onChange={(e) => setFilterKhoi(e.target.value)} disabled={!selectedNienKhoaId}>
                        <option value="">Lọc theo khối</option>
                        {khois.map(khoi => (<option key={khoi.id} value={khoi.id}>{khoi.TenKhoi}</option>))}
                    </Form.Select>
                    <Button variant="primary" onClick={() => handleShowModal('create')} disabled={!isViewingCurrentNienKhoa}>
                        <FaPlus className="me-2" /> Thêm
                    </Button>
                </Col>
            </Row>
            
            {!isViewingCurrentNienKhoa && selectedNienKhoaId && (
                 <Alert variant="warning">
                    Bạn đang xem dữ liệu của một niên khóa cũ. Mọi thao tác thêm, sửa, xóa đều bị vô hiệu hóa.
                </Alert>
            )}

            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    {isFetchingStudents ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <StudentTable students={students} onEdit={handleShowModal} onDelete={handleDelete} isReadOnly={!isViewingCurrentNienKhoa} />
                    )}
                </Card.Body>
                { !isFetchingStudents && selectedNienKhoaId && students.length === 0 && (
                     <Card.Footer className="text-center text-muted p-3">
                        Không tìm thấy học sinh nào phù hợp.
                        {isViewingCurrentNienKhoa && !searchTerm && !filterKhoi && (
                            <Button variant="link" onClick={() => handleShowModal('create')} className="p-0 ms-1">Thêm học sinh mới?</Button>
                        )}
                    </Card.Footer>
                )}
            </Card>

            {showModal && (
                <StudentModal 
                    show={showModal} 
                    onHide={handleCloseModal} 
                    modalType={modalType} 
                    studentData={selectedStudent} 
                    onSubmit={handleSubmitInModal} 
                    nienKhoas={nienKhoas}
                    khois={khois}
                    currentNienKhoaId={currentNienKhoaId}
                />
            )}
        </Container>
    );
};

export default StudentManagement;