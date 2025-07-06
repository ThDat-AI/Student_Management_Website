import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Row, Col, ListGroup, Card, Spinner, Alert, Badge, Container, Form, InputGroup } from 'react-bootstrap';
import { FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';
import api from '../../../../api/index';
import { toast } from 'react-toastify';
import './lapDanhSachLop.css';

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
        <Modal show={show} onHide={handleClose} size="xl" centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    Quản lý danh sách lớp: {lopHocInfo?.TenLop} ({lopHocInfo?.TenNienKhoa})
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading && <div className="text-center my-5"><Spinner animation="border" /></div>}
                {error && <Alert variant="danger">{error}</Alert>}
                {!loading && !error && (
                    <Container fluid>
                        <Row>
                            <Col>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <span>Học sinh trong lớp ({studentsInClass.length})</span>
                                        <Badge bg={isOverCapacity ? 'danger' : 'primary'} className="ms-2">
                                            Sĩ số: {studentsInClass.length} / {siSoToiDa}
                                        </Badge>
                                    </Card.Header>
                                    <div className="p-2 border-bottom">
                                        <InputGroup size="sm">
                                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                                            <Form.Control placeholder="Tìm trong lớp..." value={searchInClass} onChange={e => setSearchInClass(e.target.value)} />
                                        </InputGroup>
                                    </div>
                                    <ListGroup variant="flush" className="dual-listbox">
                                        {filteredStudentsInClass.length > 0 ? filteredStudentsInClass.map(student => (
                                            <ListGroup.Item 
                                                key={student.id} 
                                                action 
                                                active={selectedInClass.includes(student.id)}
                                                onClick={() => handleSelect(student, 'inClass')}
                                                onDoubleClick={() => handleDoubleClickRemove(student)}
                                            >
                                                {student.Ho} {student.Ten} <span className='text-muted'>({student.NgaySinh})</span>
                                            </ListGroup.Item>
                                        )) : (
                                            <ListGroup.Item className='text-center text-muted'>Không có học sinh nào</ListGroup.Item>
                                        )}
                                    </ListGroup>
                                </Card>
                            </Col>

                            <Col xs="auto" className="d-flex flex-column justify-content-center align-items-center px-2">
                                <Button variant="light" className="mb-2 border" onClick={handleAdd} disabled={selectedAvailable.length === 0} title="Thêm vào lớp"> <FaArrowLeft /> </Button>
                                <Button variant="light" className="border" onClick={handleRemove} disabled={selectedInClass.length === 0} title="Xóa khỏi lớp"> <FaArrowRight /> </Button>
                            </Col>

                            <Col>
                                <Card>
                                    <Card.Header>Học sinh đủ điều kiện ({availableStudents.length})</Card.Header>
                                    <div className="p-2 border-bottom">
                                        <InputGroup size="sm">
                                            {/* SỬA LỖI Ở DÒNG DƯỚI ĐÂY */}
                                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                                            <Form.Control placeholder="Tìm học sinh đủ điều kiện..." value={searchAvailable} onChange={e => setSearchAvailable(e.target.value)} />
                                        </InputGroup>
                                    </div>
                                    <ListGroup variant="flush" className="dual-listbox">
                                         {filteredAvailableStudents.length > 0 ? filteredAvailableStudents.map(student => (
                                            <ListGroup.Item 
                                                key={student.id} 
                                                action
                                                active={selectedAvailable.includes(student.id)}
                                                onClick={() => handleSelect(student, 'available')}
                                                onDoubleClick={() => handleDoubleClickAdd(student)}
                                            >
                                                {student.Ho} {student.Ten} <span className='text-muted'>({student.NgaySinh})</span>
                                            </ListGroup.Item>
                                        )) : (
                                             <ListGroup.Item className='text-center text-muted'>Không có học sinh nào</ListGroup.Item>
                                        )}
                                    </ListGroup>
                                </Card>
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