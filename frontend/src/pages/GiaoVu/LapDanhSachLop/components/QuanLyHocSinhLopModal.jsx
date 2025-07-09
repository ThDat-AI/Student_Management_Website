import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Row, Col, Table, Card, Spinner, Alert, Badge, Container, Form, InputGroup } from 'react-bootstrap';
import { FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';
import api from '../../../../api/index';
import { toast } from 'react-toastify';
import './LapDanhSachLop.css';

// Component con để hiển thị bảng học sinh
// === COMPONENT NÀY SẼ ĐƯỢC CẬP NHẬT Ở DƯỚI ===
const StudentTable = ({ title, students, selectedIds, onSelect, onSelectAll, onDoubleClick, searchTerm, setSearchTerm }) => {
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

    return (
        <Card className="h-100 d-flex flex-column shadow-sm">
            <Card.Header className="fw-bold">{title} ({students.length})</Card.Header>
            <div className="p-2 border-bottom">
                <InputGroup size="sm">
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control 
                        placeholder="Tìm theo tên..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </InputGroup>
            </div>
            <div className="table-responsive flex-grow-1"> 
                <Table striped hover size="sm" className="mb-0 dual-listbox-table">
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>
                                <Form.Check 
                                    type="checkbox"
                                    onChange={onSelectAll}
                                    checked={students.length > 0 && selectedIds.length === students.length}
                                    disabled={students.length === 0}
                                />
                            </th>
                            <th>Họ và Tên</th>
                            <th>Giới tính</th>
                            <th>Ngày sinh</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length > 0 ? students.map(student => (
                            <tr key={student.id} onDoubleClick={() => onDoubleClick(student)}>
                                <td>
                                    <Form.Check 
                                        type="checkbox"
                                        checked={selectedIds.includes(student.id)}
                                        onChange={() => onSelect(student.id)}
                                    />
                                </td>
                                <td>{`${student.Ho} ${student.Ten}`}</td>
                                <td>{student.GioiTinh}</td>
                                <td>{formatDate(student.NgaySinh)}</td>
                                <td>{student.Email || '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center text-muted py-3">Không có học sinh</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
};


const QuanLyHocSinhLopModal = ({ show, handleClose, lopHocId, onSaveSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [lopHocInfo, setLopHocInfo] = useState(null);
    const [studentsInClass, setStudentsInClass] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [siSoToiDa, setSiSoToiDa] = useState(0);
    const [selectedInClass, setSelectedInClass] = useState([]);
    const [selectedAvailable, setSelectedAvailable] = useState([]);
    const [searchInClass, setSearchInClass] = useState('');
    const [searchAvailable, setSearchAvailable] = useState('');

    const fetchData = useCallback(async () => {
        if (!lopHocId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/classes/lophoc/${lopHocId}/hocsinh/`);
            setLopHocInfo(res.data.lop_hoc_info);
            setStudentsInClass(res.data.students_in_class);
            setAvailableStudents(res.data.students_available);
            setSiSoToiDa(res.data.siso_toida);
        } catch (err) {
            setError('Không thể tải dữ liệu học sinh.');
            toast.error('Lỗi: ' + (err.response?.data?.detail || 'Không thể tải dữ liệu học sinh.'));
        } finally {
            setLoading(false);
        }
    }, [lopHocId]);

    useEffect(() => {
        if (show) {
            fetchData();
        } else {
            setStudentsInClass([]);
            setAvailableStudents([]);
            setSelectedInClass([]);
            setSelectedAvailable([]);
            setSearchInClass('');
            setSearchAvailable('');
        }
    }, [show, fetchData]);

    const filteredStudentsInClass = useMemo(() => {
        if (!searchInClass) return studentsInClass;
        return studentsInClass.filter(student =>
            `${student.Ho} ${student.Ten}`.toLowerCase().includes(searchInClass.toLowerCase())
        );
    }, [studentsInClass, searchInClass]);

    const filteredAvailableStudents = useMemo(() => {
        if (!searchAvailable) return availableStudents;
        return availableStudents.filter(student =>
            `${student.Ho} ${student.Ten}`.toLowerCase().includes(searchAvailable.toLowerCase())
        );
    }, [availableStudents, searchAvailable]);

    const handleSelect = (studentId, listType) => {
        const setSelected = listType === 'inClass' ? setSelectedInClass : setSelectedAvailable;
        setSelected(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
    };
    
    const handleSelectAll = (listType) => {
        if (listType === 'inClass') {
            setSelectedInClass(prev => prev.length === filteredStudentsInClass.length ? [] : filteredStudentsInClass.map(s => s.id));
        } else {
            setSelectedAvailable(prev => prev.length === filteredAvailableStudents.length ? [] : filteredAvailableStudents.map(s => s.id));
        }
    };

    const moveStudents = (fromList, setFromList, toList, setToList, selectedIds, setSelectedIds) => {
        const studentsToMove = fromList.filter(s => selectedIds.includes(s.id));
        setToList(prev => [...prev, ...studentsToMove].sort((a, b) => a.Ten.localeCompare(b.Ten)));
        setFromList(prev => prev.filter(s => !selectedIds.includes(s.id)));
        setSelectedIds([]);
    };

    const handleAdd = () => moveStudents(availableStudents, setAvailableStudents, studentsInClass, setStudentsInClass, selectedAvailable, setSelectedAvailable);
    const handleRemove = () => moveStudents(studentsInClass, setStudentsInClass, availableStudents, setAvailableStudents, selectedInClass, setSelectedInClass);

    const handleDoubleClick = (student, fromListType) => {
        if (fromListType === 'available') {
            setAvailableStudents(prev => prev.filter(s => s.id !== student.id));
            setStudentsInClass(prev => [...prev, student].sort((a, b) => a.Ten.localeCompare(b.Ten)));
        } else {
            setStudentsInClass(prev => prev.filter(s => s.id !== student.id));
            setAvailableStudents(prev => [...prev, student].sort((a, b) => a.Ten.localeCompare(b.Ten)));
        }
    };

    const handleSave = async () => {
        if (studentsInClass.length > siSoToiDa) {
            toast.error(`Sĩ số lớp (${studentsInClass.length}) không được vượt quá sĩ số tối đa (${siSoToiDa}).`);
            return;
        }
        setSaving(true);
        try {
            const student_ids = studentsInClass.map(s => s.id);
            await api.post(`/api/classes/lophoc/${lopHocId}/hocsinh/`, { student_ids });
            onSaveSuccess();
        } catch (err) {
            toast.error('Lỗi khi lưu: ' + (err.response?.data?.detail || 'Đã có lỗi xảy ra.'));
        } finally {
            setSaving(false);
        }
    };

    const isOverCapacity = studentsInClass.length > siSoToiDa;

    return (
        <Modal show={show} onHide={handleClose} fullscreen={true} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center">
                    Quản lý danh sách lớp: {lopHocInfo?.TenLop}
                    {siSoToiDa > 0 && 
                        <Badge bg={isOverCapacity ? 'danger' : 'primary'} className="ms-3 fs-6 fw-normal">
                            Sĩ số: {studentsInClass.length} / {siSoToiDa}
                        </Badge>
                    }
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column">
                {loading ? (
                    <div className="text-center my-5"><Spinner animation="border" /></div>
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : (
                    <Container fluid className="flex-grow-1">
                        <Row className="h-100">
                            <Col className="d-flex flex-column">
                                <StudentTable
                                    title="Học sinh trong lớp" students={filteredStudentsInClass} selectedIds={selectedInClass}
                                    onSelect={(id) => handleSelect(id, 'inClass')} onSelectAll={() => handleSelectAll('inClass')}
                                    onDoubleClick={(student) => handleDoubleClick(student, 'inClass')}
                                    searchTerm={searchInClass} setSearchTerm={setSearchInClass}
                                />
                            </Col>

                            <Col xs="auto" className="d-flex flex-column justify-content-center align-items-center px-2">
                                <Button variant="light" className="mb-2 border" onClick={handleAdd} disabled={selectedAvailable.length === 0} title="Thêm vào lớp"> <FaArrowLeft /> </Button>
                                <Button variant="light" className="border" onClick={handleRemove} disabled={selectedInClass.length === 0} title="Xóa khỏi lớp"> <FaArrowRight /> </Button>
                            </Col>

                            <Col className="d-flex flex-column">
                                <StudentTable
                                    title="Học sinh đủ điều kiện" students={filteredAvailableStudents} selectedIds={selectedAvailable}
                                    onSelect={(id) => handleSelect(id, 'available')} onSelectAll={() => handleSelectAll('available')}
                                    onDoubleClick={(student) => handleDoubleClick(student, 'available')}
                                    searchTerm={searchAvailable} setSearchTerm={setSearchAvailable}
                                />
                            </Col>
                        </Row>
                    </Container>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}> Hủy </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading || isOverCapacity}>
                    {saving ? <><Spinner as="span" animation="border" size="sm" /> Đang lưu...</> : 'Lưu thay đổi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default QuanLyHocSinhLopModal;