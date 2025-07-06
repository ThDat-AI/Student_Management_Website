// src/pages/BGH/StudentManagement/StudentManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useLayout } from '../../../contexts/LayoutContext';
import { Container, Row, Col, Button, Alert, Form, Card, Spinner, InputGroup, Dropdown } from 'react-bootstrap';
import { FaPlus, FaSearch, FaUserGraduate, FaFilter } from 'react-icons/fa';
import api from '../../../api/index';

import confirmDelete from '../../../components/ConfirmDelete';
// Import các component con
import StudentModal from './components/StudentModal';
import StudentTable from './components/StudentTable';

const StudentManagement = () => {
    // === STATE ===
    const [students, setStudents] = useState([]);
    const [nienKhoas, setNienKhoas] = useState([]); // Danh sách niên khóa để lọc
    const [khois, setKhois] = useState([]);         // Danh sách khối để lọc
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterNienKhoa, setFilterNienKhoa] = useState(''); // ID Niên khóa được chọn để lọc
    const [filterKhoi, setFilterKhoi] = useState('');         // ID Khối được chọn để lọc

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedStudent, setSelectedStudent] = useState(null);
    
    const { setPageTitle } = useLayout();

    // === EFFECTS ===
    useEffect(() => { setPageTitle("Quản lý học sinh"); }, [setPageTitle]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                search: searchTerm,
                nien_khoa_id: filterNienKhoa,
                khoi_id: filterKhoi,
            };
            const [studentsRes, nienKhoasRes, khoisRes] = await Promise.all([
                api.get('/api/students/hocsinh/', { params }),
                // SỬA ĐỔI: URL API cho dropdown lọc
                api.get('/api/students/filters/nienkhoa/'), 
                api.get('/api/students/filters/khoi/'),     
            ]);
            setStudents(studentsRes.data);
            setNienKhoas(nienKhoasRes.data);
            setKhois(khoisRes.data);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu:", err);
            setError("Không thể tải dữ liệu học sinh. Vui lòng kiểm tra kết nối.");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filterNienKhoa, filterKhoi]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchData(); }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [fetchData]);

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
    
    const handleSubmitInModal = async (formData, studentId) => {
        try {
            if (modalType === 'create') {
                await api.post('/api/students/hocsinh/', formData);
                setSuccess('Thêm học sinh thành công!');
            } else {
                await api.patch(`/api/students/hocsinh/${studentId}/`, formData);
                setSuccess('Cập nhật thông tin học sinh thành công!');
            }
            handleCloseModal();
            fetchData(); // Tải lại dữ liệu
            return { success: true };
        } catch (err) {
            console.error("Lỗi khi submit form:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join(' ');
            return { success: false, error: errorMsg || "Thao tác không thành công. Vui lòng kiểm tra lại thông tin." };
        }
    };

    const handleDelete = async (student) => {
        const isConfirmed = await confirmDelete(`Bạn có chắc muốn xóa học sinh "${student.Ho} ${student.Ten}"?`);
        if (!isConfirmed) return;
        {
            try {
                await api.delete(`/api/students/hocsinh/${student.id}/`);
                setSuccess('Xóa học sinh thành công!');
                fetchData(); // Tải lại dữ liệu
            } catch (err) {
                console.error("Lỗi khi xóa:", err.response?.data || err.message);
                const errorMsg = err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join(' ');
                setError(errorMsg || "Xóa học sinh không thành công.");
            }
        }
    };

    // === RENDER ===
    return (
        <Container fluid className="py-4">
            {/* Header và Controls */}
            <Row className="justify-content-between align-items-center mb-4">
                <Col xs={12} md={6} lg={4}>
                    <h2 className="h4 mb-2 mb-md-0">
                        <FaUserGraduate className="me-2 text-primary" />
                        Quản lý học sinh
                    </h2>
                </Col>
                <Col xs={12} md={6} lg={8} className="d-flex flex-wrap justify-content-end gap-2">
                    {/* Search Bar */}
                    <InputGroup className="flex-grow-1" style={{ maxWidth: '300px' }}>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control type="search" placeholder="Tìm theo tên, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </InputGroup>

                    {/* Filter Dropdowns */}
                    <Dropdown as={InputGroup} className="flex-grow-1" style={{ maxWidth: '240px' }}>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Select value={filterNienKhoa} onChange={(e) => setFilterNienKhoa(e.target.value)}>
                            <option value="">Lọc theo niên khóa</option>
                            {nienKhoas.map(nk => (
                                <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>
                            ))}
                        </Form.Select>
                    </Dropdown>

                    <Dropdown as={InputGroup} className="flex-grow-1" style={{ maxWidth: '190px' }}>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Select value={filterKhoi} onChange={(e) => setFilterKhoi(e.target.value)}>
                            <option value="">Lọc theo khối</option>
                            {khois.map(khoi => (
                                <option key={khoi.id} value={khoi.id}>{khoi.TenKhoi}</option>
                            ))}
                        </Form.Select>
                    </Dropdown>

                    {/* Add New Button */}
                    <Button variant="primary" onClick={() => handleShowModal('create')}>
                        <FaPlus className="me-2" /> Thêm học sinh
                    </Button>
                </Col>
            </Row>

            {/* Alerts */}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            {/* Main Content: Table or No Data Message */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : students.length > 0 ? (
                        <StudentTable 
                            students={students} 
                            onEdit={handleShowModal} 
                            onDelete={handleDelete}
                        />
                    ) : (
                        <div className="text-center text-muted p-4">
                            <FaUserGraduate size={48} className="mb-3" />
                            <h5 className="text-muted">
                                {searchTerm || filterNienKhoa || filterKhoi
                                    ? `Không tìm thấy học sinh nào phù hợp với điều kiện tìm kiếm.`
                                    : `Chưa có học sinh nào trong hệ thống.`}
                            </h5>
                            {!searchTerm && !filterNienKhoa && !filterKhoi && (
                                <Button variant="primary" onClick={() => handleShowModal('create')} className="mt-3">
                                    <FaPlus className="me-2" /> Thêm học sinh đầu tiên
                                </Button>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Student Modal */}
            {showModal && (
                <StudentModal 
                    show={showModal} 
                    onHide={handleCloseModal} 
                    modalType={modalType} 
                    studentData={selectedStudent} 
                    onSubmit={handleSubmitInModal}
                />
            )}
        </Container>
    );
};

export default StudentManagement;