// src/pages/GiaoVu/LapDanhSachLop/components/QuanLyHocSinhLopModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Row, Col, Table, Card, Spinner, Alert, Badge, Container, Form, InputGroup } from 'react-bootstrap';
import { FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';
import api from '../../../../api/index';
import { toast } from 'react-toastify';
import './LapDanhSachLop.css';

// Component con để hiển thị bảng học sinh
const StudentTable = ({ title, students, selectedIds, onSelect, onSelectAll, onDoubleClick, searchTerm, setSearchTerm }) => {
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

    return (
        <Card className="h-100 d-flex flex-column">
            <Card.Header>{title} ({students.length})</Card.Header>
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
            <div className="table-responsive dual-listbox flex-grow-1"> 
                <Table striped hover size="sm" className="mb-0">
                    <thead>
                        <tr>
                            <th>
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
                            <tr key={student.id} onDoubleClick={() => onDoubleClick(student)} style={{cursor: 'pointer'}}>
                                <td>
                                    <Form.Check 
                                        type="checkbox"
                                        checked={selectedIds.includes(student.id)}
                                        onChange={() => onSelect(student)}
                                    />
                                </td>
                                <td>{`${student.Ho} ${student.Ten}`}</td>
                                <td>{student.GioiTinh}</td>
                                <td>{formatDate(student.NgaySinh)}</td>
                                <td>{student.Email || '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                {/* Cập nhật colspan thành 5 */}
                                <td colSpan="5" className="text-center text-muted">Không có học sinh</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
};


const QuanLyHocSinhLopModal = ({ show, handleClose, lopHocId, onSaveSuccess }) => {
    const [loading, setLoading] = useState(false);
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
            setLopHocInfo(null);
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

    const handleSelect = (student, listType) => {
        const selectedList = listType === 'inClass' ? selectedInClass : selectedAvailable;
        const setSelectedList = listType === 'inClass' ? setSelectedInClass : setSelectedAvailable;
        const studentId = student.id;

        if (selectedList.includes(studentId)) {
            setSelectedList(selectedList.filter(id => id !== studentId));
        } else {
            setSelectedList([...selectedList, studentId]);
        }
    };
    
    const handleSelectAll = (listType) => {
        if (listType === 'inClass') {
            if (selectedInClass.length === filteredStudentsInClass.length) {
                setSelectedInClass([]);
            } else {
                setSelectedInClass(filteredStudentsInClass.map(s => s.id));
            }
        } else {
            if (selectedAvailable.length === filteredAvailableStudents.length) {
                setSelectedAvailable([]);
            } else {
                setSelectedAvailable(filteredAvailableStudents.map(s => s.id));
            }
        }
    };

    const handleAdd = () => {
        const toMove = availableStudents.filter(s => selectedAvailable.includes(s.id));
        setStudentsInClass([...studentsInClass, ...toMove].sort((a,b) => a.Ten.localeCompare(b.Ten)));
        setAvailableStudents(availableStudents.filter(s => !selectedAvailable.includes(s.id)));
        setSelectedAvailable([]);
    };

    const handleRemove = () => {
        const toMove = studentsInClass.filter(s => selectedInClass.includes(s.id));
        setAvailableStudents([...availableStudents, ...toMove].sort((a,b) => a.Ten.localeCompare(b.Ten)));
        setStudentsInClass(studentsInClass.filter(s => !selectedInClass.includes(s.id)));
        setSelectedInClass([]);
    };

    const handleDoubleClickAdd = (studentToAdd) => {
        if (studentsInClass.length >= siSoToiDa) {
            toast.warn(`Sĩ số đã đạt tối đa (${siSoToiDa}).`);
            return;
        }
        setAvailableStudents(prev => prev.filter(s => s.id !== studentToAdd.id));
        setStudentsInClass(prev => [...prev, studentToAdd].sort((a, b) => a.Ten.localeCompare(b.Ten)));
    };

    const handleDoubleClickRemove = (studentToRemove) => {
        setStudentsInClass(prev => prev.filter(s => s.id !== studentToRemove.id));
        setAvailableStudents(prev => [...prev, studentToRemove].sort((a, b) => a.Ten.localeCompare(b.Ten)));
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
                        <Badge bg={isOverCapacity ? 'danger' : 'primary'} className="ms-3 fs-6">
                            Sĩ số: {studentsInClass.length} / {siSoToiDa}
                        </Badge>
                    }
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading && <div className="text-center my-5"><Spinner animation="border" /></div>}
                {error && <Alert variant="danger">{error}</Alert>}
                {!loading && !error && (
                    <Container fluid className="h-100">
                        <Row className="h-100">
                            <Col>
                                <StudentTable
                                    title="Học sinh trong lớp"
                                    students={filteredStudentsInClass}
                                    selectedIds={selectedInClass}
                                    onSelect={(student) => handleSelect(student, 'inClass')}
                                    onSelectAll={() => handleSelectAll('inClass')}
                                    onDoubleClick={handleDoubleClickRemove}
                                    searchTerm={searchInClass}
                                    setSearchTerm={setSearchInClass}
                                />
                            </Col>

                            <Col xs="auto" className="d-flex flex-column justify-content-center align-items-center px-2">
                                <Button variant="light" className="mb-2 border" onClick={handleAdd} disabled={selectedAvailable.length === 0 || isOverCapacity} title="Thêm vào lớp"> <FaArrowLeft /> </Button>
                                <Button variant="light" className="border" onClick={handleRemove} disabled={selectedInClass.length === 0} title="Xóa khỏi lớp"> <FaArrowRight /> </Button>
                            </Col>

                            <Col>
                                <StudentTable
                                    title="Học sinh đủ điều kiện"
                                    students={filteredAvailableStudents}
                                    selectedIds={selectedAvailable}
                                    onSelect={(student) => handleSelect(student, 'available')}
                                    onSelectAll={() => handleSelectAll('available')}
                                    onDoubleClick={handleDoubleClickAdd}
                                    searchTerm={searchAvailable}
                                    setSearchTerm={setSearchAvailable}
                                />
                            </Col>
                        </Row>
                    </Container>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}> Hủy </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading || isOverCapacity}>
                    {saving ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Đang lưu...</> : 'Lưu thay đổi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default QuanLyHocSinhLopModal;