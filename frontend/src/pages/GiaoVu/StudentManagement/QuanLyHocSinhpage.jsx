import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLayout } from '../../../contexts/LayoutContext';
import { Container, Row, Col, Button, Form, Card, Spinner, InputGroup, Dropdown, Alert } from 'react-bootstrap';
import { FaPlus, FaSearch, FaUserGraduate, FaFilter } from 'react-icons/fa';
import api from '../../../api/index';
import { toast } from 'react-toastify';
import { useDebounce } from 'use-debounce';

import confirmDelete from '../../../components/ConfirmDelete';
import StudentModal from './components/StudentModal';
import StudentTable from './components/StudentTable';

const StudentManagement = () => {
    // === STATE ===
    const [students, setStudents] = useState([]);
    const [nienKhoas, setNienKhoas] = useState([]);
    const [khois, setKhois] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300); // Debounce để tìm kiếm mượt hơn

    const [selectedNienKhoaId, setSelectedNienKhoaId] = useState('');
    const [currentNienKhoaId, setCurrentNienKhoaId] = useState(null);
    const [isViewingCurrentNienKhoa, setIsViewingCurrentNienKhoa] = useState(false);
    
    const [filterKhoi, setFilterKhoi] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Dùng ref để lưu trữ danh sách học sinh cũ khi thực hiện optimistic update
    const previousStudents = useRef([]);
    
    const { setPageTitle } = useLayout();

    // === EFFECTS ===
    useEffect(() => { 
        document.title = "Quản lý học sinh"; 
        setPageTitle("Quản lý học sinh"); 
    }, [setPageTitle]);

    // CHỈ TẢI CÁC BỘ LỌC MỘT LẦN KHI VÀO TRANG
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [nienKhoasRes, khoisRes] = await Promise.all([
                    api.get('/api/students/filters/nienkhoa/'), 
                    api.get('/api/students/filters/khoi/'),     
                ]);
                
                const fetchedNienKhoas = nienKhoasRes.data;
                setNienKhoas(fetchedNienKhoas);
                setKhois(khoisRes.data);

                const current = fetchedNienKhoas.find(nk => nk.is_current);
                if (current) {
                    setCurrentNienKhoaId(current.id);
                    setSelectedNienKhoaId(current.id);
                } else if (fetchedNienKhoas.length > 0) {
                    const firstId = fetchedNienKhoas[0].id;
                    setCurrentNienKhoaId(firstId);
                    setSelectedNienKhoaId(firstId);
                } else {
                    toast.warn("Chưa có niên khóa nào trong hệ thống.");
                    setLoading(false); // Dừng loading nếu không có niên khóa
                }
            } catch (err) {
                toast.error("Không thể tải dữ liệu cần thiết cho trang.");
                setLoading(false);
            }
        };
        fetchFilters();
    }, []);

    // TẢI DANH SÁCH HỌC SINH KHI CÁC BỘ LỌC THAY ĐỔI
    useEffect(() => {
        if (!selectedNienKhoaId) return;

        const fetchStudents = async () => {
            setLoading(true);
            try {
                const params = {
                    search: debouncedSearchTerm,
                    nien_khoa_id: selectedNienKhoaId,
                    khoi_id: filterKhoi,
                };
                const res = await api.get('/api/students/hocsinh/', { params });
                setStudents(res.data);
            } catch (err) {
                toast.error("Không thể tải danh sách học sinh.");
                setStudents([]); // Xóa danh sách cũ nếu lỗi
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [debouncedSearchTerm, filterKhoi, selectedNienKhoaId]);
    
    // Cập nhật trạng thái "đang xem niên khóa hiện tại"
    useEffect(() => {
        setIsViewingCurrentNienKhoa(selectedNienKhoaId === currentNienKhoaId);
    }, [selectedNienKhoaId, currentNienKhoaId]);

    // === HANDLERS ===
    const handleShowModal = (type, student = null) => {
        setModalType(type);
        setSelectedStudent(student);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedStudent(null);
    };
    
    // Tối ưu hóa với Optimistic Update
    const handleSubmitInModal = async (formData, studentId) => {
        handleCloseModal(); // Đóng modal ngay lập tức
        
        if (modalType === 'create') {
            // Hiển thị một bản ghi tạm thời
            const tempStudent = { id: `temp-${Date.now()}`, ...formData, is_deletable: true, TenNienKhoaTiepNhan: nienKhoas.find(nk => nk.id === formData.IDNienKhoaTiepNhan)?.TenNienKhoa, TenKhoiDuKien: khois.find(k => k.id === formData.KhoiDuKien)?.TenKhoi };
            previousStudents.current = students;
            setStudents(prev => [tempStudent, ...prev]);
            
            try {
                const res = await api.post('/api/students/hocsinh/', formData);
                // Thay thế bản ghi tạm thời bằng dữ liệu thật từ server
                setStudents(prev => prev.map(s => s.id === tempStudent.id ? res.data : s));
                toast.success('Thêm học sinh thành công!');
            } catch (err) {
                toast.error(err.response?.data?.detail || "Thêm mới thất bại.");
                setStudents(previousStudents.current); // Rollback
            }
        } else { // Chế độ sửa
            const originalStudent = students.find(s => s.id === studentId);
            const updatedStudent = { ...originalStudent, ...formData, TenKhoiDuKien: khois.find(k => k.id === formData.KhoiDuKien)?.TenKhoi };
            
            previousStudents.current = students;
            setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

            try {
                await api.patch(`/api/students/hocsinh/${studentId}/`, formData);
                toast.success('Cập nhật thành công!');
            } catch (err) {
                toast.error(err.response?.data?.detail || "Cập nhật thất bại.");
                setStudents(previousStudents.current); // Rollback
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
        
        // Optimistic delete
        previousStudents.current = students;
        setStudents(prev => prev.filter(s => s.id !== student.id));

        try {
            await api.delete(`/api/students/hocsinh/${student.id}/`);
            toast.success('Xóa học sinh thành công!');
        } catch (err) {
            toast.error(err.response?.data?.detail || "Xóa thất bại.");
            setStudents(previousStudents.current); // Rollback
        }
    };

    // === RENDER ===
    return (
        <Container fluid className="py-4">
            <Row className="justify-content-between align-items-center mb-4">
                <Col xs={12} md={6} lg={4}>
                    <h2 className="h4 mb-2 mb-md-0 d-flex align-items-center">
                        <FaUserGraduate className="me-2 text-primary" /> Quản lý học sinh
                    </h2>
                </Col>
                <Col xs={12} md={6} lg={8} className="d-flex flex-wrap justify-content-end gap-2">
                    <InputGroup className="flex-grow-1" style={{ maxWidth: '300px' }}>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control type="search" placeholder="Tìm theo tên, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </InputGroup>
                    <Dropdown as={InputGroup} className="flex-grow-1" style={{ maxWidth: '240px' }}>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Select value={selectedNienKhoaId} onChange={(e) => setSelectedNienKhoaId(Number(e.target.value))}>
                            {nienKhoas.length === 0 && <option>Đang tải...</option>}
                            {nienKhoas.map(nk => (<option key={nk.id} value={nk.id}>{nk.TenNienKhoa}{nk.is_current ? ' (Hiện hành)' : ''}</option>))}
                        </Form.Select>
                    </Dropdown>
                    <Dropdown as={InputGroup} className="flex-grow-1" style={{ maxWidth: '220px' }}>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Select value={filterKhoi} onChange={(e) => setFilterKhoi(e.target.value)}>
                            <option value="">Lọc theo khối</option>
                            {khois.map(khoi => (<option key={khoi.id} value={khoi.id}>{khoi.TenKhoi}</option>))}
                        </Form.Select>
                    </Dropdown>
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
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <StudentTable students={students} onEdit={handleShowModal} onDelete={handleDelete} isReadOnly={!isViewingCurrentNienKhoa} />
                    )}
                </Card.Body>
                { !loading && students.length === 0 && (
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
                    isViewingCurrentNienKhoa={isViewingCurrentNienKhoa}
                />
            )}
        </Container>
    );
};

export default StudentManagement;