import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    const [students, setStudents] = useState([]);
    const [khois, setKhois] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [filterKhoi, setFilterKhoi] = useState('');

    const [nienKhoas, setNienKhoas] = useState([]);
    const [selectedNienKhoaId, setSelectedNienKhoaId] = useState(null);
    const [currentNienKhoaId, setCurrentNienKhoaId] = useState(null);

    const [isInitializing, setIsInitializing] = useState(true);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedStudent, setSelectedStudent] = useState(null);

    const abortControllerRef = useRef(null);
    const lastFetchParamsRef = useRef(null);
    const isComponentMountedRef = useRef(true);

    const { setPageTitle } = useLayout();

    useEffect(() => {
        return () => {
            isComponentMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const isViewingCurrentNienKhoa = useMemo(() =>
        selectedNienKhoaId === currentNienKhoaId,
        [selectedNienKhoaId, currentNienKhoaId]
    );

    useEffect(() => {
        document.title = "Quản lý học sinh";
        setPageTitle("Quản lý học sinh");
    }, [setPageTitle]);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsInitializing(true);
                const [nienKhoasRes, khoisRes] = await Promise.all([
                    api.get('/api/students/filters/nienkhoa/'),
                    api.get('/api/students/filters/khoi/')
                ]);

                if (!isComponentMountedRef.current) return;

                const fetchedNienKhoas = nienKhoasRes.data;
                const fetchedKhois = khoisRes.data;

                setNienKhoas(fetchedNienKhoas);
                setKhois(fetchedKhois);

                const current = fetchedNienKhoas.find(nk => nk.is_current);
                const initialNienKhoaId = current?.id || fetchedNienKhoas[0]?.id || null;

                setCurrentNienKhoaId(current?.id || null);
                setSelectedNienKhoaId(initialNienKhoaId);

                if (initialNienKhoaId) {
                    await loadStudents({
                        nien_khoa_id: initialNienKhoaId,
                    });
                }

                setIsReady(true);

            } catch (err) {
                console.error('Initialize error:', err);
                toast.error("Không thể tải dữ liệu cần thiết cho trang.");
            } finally {
                if (isComponentMountedRef.current) {
                    setIsInitializing(false);
                }
            }
        };

        initializeData();
    }, []);

    const loadStudents = useCallback(async (params) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const currentFetchParams = { nien_khoa_id: params.nien_khoa_id };
        const paramsKey = JSON.stringify(currentFetchParams);
        if (lastFetchParamsRef.current === paramsKey) {
            return;
        }
        lastFetchParamsRef.current = paramsKey;

        abortControllerRef.current = new AbortController();

        try {
            setIsFetchingStudents(true);

            const res = await api.get('/api/students/hocsinh/', {
                params: { nien_khoa_id: params.nien_khoa_id },
                signal: abortControllerRef.current.signal
            });

            if (!isComponentMountedRef.current) return;

            const newStudents = res.data;
            setStudents(newStudents);

        } catch (err) {
            if (err.name !== 'AbortError' && isComponentMountedRef.current) {
                console.error('Load students error:', err);
                toast.error("Không thể tải danh sách học sinh.");
                setStudents([]);
            }
        } finally {
            if (isComponentMountedRef.current) {
                setIsFetchingStudents(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!isReady || !selectedNienKhoaId) return;

        setSearchTerm('');
        setFilterKhoi('');
        loadStudents({ nien_khoa_id: selectedNienKhoaId });
    }, [selectedNienKhoaId, isReady, loadStudents]);

    const filteredAndSearchedStudents = useMemo(() => {
        let tempStudents = [...students];

        if (debouncedSearchTerm) {
            const lowercasedSearchTerm = debouncedSearchTerm.toLowerCase();
            tempStudents = tempStudents.filter(student =>
                (student.Ho?.toLowerCase().includes(lowercasedSearchTerm) ||
                 student.Ten?.toLowerCase().includes(lowercasedSearchTerm) ||
                 student.Email?.toLowerCase().includes(lowercasedSearchTerm) ||
                 student.MaHocSinh?.toLowerCase().includes(lowercasedSearchTerm))
            );
        }

        if (filterKhoi) {
            tempStudents = tempStudents.filter(student =>
                student.KhoiDuKien === Number(filterKhoi)
            );
        }

        return tempStudents;
    }, [students, debouncedSearchTerm, filterKhoi]);

    const handleFilterChange = useCallback((e) => {
        const newValue = Number(e.target.value);
        setSelectedNienKhoaId(newValue);
    }, []);

    const handleShowModal = useCallback((type, student = null) => {
        setModalType(type);
        setSelectedStudent(student);
        setShowModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setSelectedStudent(null);
    }, []);

    const handleSubmitInModal = useCallback(async (formData, studentId) => {
        handleCloseModal();

        if (modalType === 'create') {
            const tempStudent = {
                id: `temp-${Date.now()}`,
                ...formData,
                is_deletable: true,
                TenNienKhoaTiepNhan: nienKhoas.find(nk => nk.id === formData.IDNienKhoaTiepNhan)?.TenNienKhoa,
                TenKhoiDuKien: khois.find(k => k.id === Number(formData.KhoiDuKien))?.TenKhoi,
                _isOptimistic: true
            };

            setStudents(prev => [tempStudent, ...prev]);

            try {
                const res = await api.post('/api/students/hocsinh/', formData);

                if (!isComponentMountedRef.current) return;

                const newStudent = res.data;
                setStudents(prev => prev.map(s =>
                    s.id === tempStudent.id ? { ...newStudent, _isOptimistic: false } : s
                ));

                toast.success('Thêm học sinh thành công!');

            } catch (err) {
                if (!isComponentMountedRef.current) return;

                setStudents(prev => prev.filter(s => s.id !== tempStudent.id));
                toast.error(err.response?.data?.detail || "Thêm mới thất bại.");
            }

        } else if (modalType === 'edit') {
            const originalStudent = students.find(s => s.id === studentId);
            const updatedStudent = {
                ...originalStudent,
                ...formData,
                TenKhoiDuKien: khois.find(k => k.id === Number(formData.KhoiDuKien))?.TenKhoi,
                _isOptimistic: true
            };

            setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

            try {
                await api.patch(`/api/students/hocsinh/${studentId}/`, formData);

                if (!isComponentMountedRef.current) return;

                setStudents(prev => prev.map(s =>
                    s.id === studentId ? { ...updatedStudent, _isOptimistic: false } : s
                ));

                toast.success('Cập nhật thành công!');

            } catch (err) {
                if (!isComponentMountedRef.current) return;

                setStudents(prev => prev.map(s => s.id === studentId ? originalStudent : s));
                toast.error(err.response?.data?.detail || "Cập nhật thất bại.");
            }
        }
    }, [modalType, students, nienKhoas, khois, handleCloseModal]);

    const handleDelete = useCallback(async (student) => {
        if (!isViewingCurrentNienKhoa || !student.is_deletable) {
            toast.warn("Không thể xóa học sinh này.");
            return;
        }

        const isConfirmed = await confirmDelete(`Bạn có chắc muốn xóa học sinh "${student.Ho} ${student.Ten}"?`);
        if (!isConfirmed) return;

        setStudents(prev => prev.map(s =>
            s.id === student.id ? { ...s, _isDeleting: true } : s
        ));

        try {
            await api.delete(`/api/students/hocsinh/${student.id}/`);

            if (!isComponentMountedRef.current) return;

            setStudents(prev => prev.filter(s => s.id !== student.id));

            toast.success('Xóa học sinh thành công!');

        } catch (err) {
            if (!isComponentMountedRef.current) return;

            setStudents(prev => prev.map(s =>
                s.id === student.id ? { ...s, _isDeleting: false } : s
            ));
            toast.error(err.response?.data?.detail || "Xóa thất bại.");
        }
    }, [isViewingCurrentNienKhoa]);

    if (isInitializing) {
        return (
            <Container fluid className="py-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Đang tải cấu hình...</p>
            </Container>
        );
    }

    if (!selectedNienKhoaId) {
        return (
            <Container fluid className="py-4">
                <Alert variant="danger">
                    Không tìm thấy niên khóa nào trong hệ thống. Vui lòng tạo niên khóa trước.
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <Row className="justify-content-between align-items-center mb-4">
                <Col xs={12} md={6} lg={4}>
                    <h2 className="h4 mb-2 mb-md-0 d-flex align-items-center">
                        <FaUserGraduate className="me-2 text-primary" />
                        Quản lý học sinh
                    </h2>
                </Col>
                <Col xs={12} md={6} lg={8} className="d-flex flex-wrap justify-content-end gap-2">
                    <InputGroup className="flex-grow-1" style={{ maxWidth: '300px' }}>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                            type="search"
                            placeholder="Tìm theo tên, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Dropdown as={InputGroup} className="flex-grow-1" style={{ maxWidth: '240px' }}>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Select value={selectedNienKhoaId} onChange={handleFilterChange}>
                            {nienKhoas.map(nk => (
                                <option key={nk.id} value={nk.id}>
                                    {nk.TenNienKhoa}{nk.is_current ? ' (Hiện hành)' : ''}
                                </option>
                            ))}
                        </Form.Select>
                    </Dropdown>

                    <Dropdown as={InputGroup} className="flex-grow-1" style={{ maxWidth: '220px' }}>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Select value={filterKhoi} onChange={(e) => setFilterKhoi(e.target.value)}>
                            <option value="">Lọc theo khối</option>
                            {khois.map(khoi => (
                                <option key={khoi.id} value={khoi.id}>
                                    {khoi.TenKhoi}
                                </option>
                            ))}
                        </Form.Select>
                    </Dropdown>

                    <Button
                        variant="primary"
                        onClick={() => handleShowModal('create')}
                        disabled={!isViewingCurrentNienKhoa}
                    >
                        <FaPlus className="me-2" /> Thêm
                    </Button>
                </Col>
            </Row>

            {!isInitializing && !isFetchingStudents && !isViewingCurrentNienKhoa && (
                <Alert variant="warning">
                    Bạn đang xem dữ liệu của một niên khóa cũ. Mọi thao tác thêm, sửa, xóa đều bị vô hiệu hóa.
                </Alert>
            )}

            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <div style={{ minHeight: '200px', position: 'relative' }}>
                        {(isFetchingStudents && filteredAndSearchedStudents.length === 0) ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" />
                                <p className="mt-2 text-muted">Đang tải danh sách học sinh...</p>
                            </div>
                        ) : (
                            <>
                                {isFetchingStudents && (
                                    <div className="position-absolute top-0 end-0 p-2" style={{ zIndex: 10 }}>
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                )}

                                <StudentTable
                                    students={filteredAndSearchedStudents}
                                    onEdit={handleShowModal}
                                    onDelete={handleDelete}
                                    isReadOnly={!isViewingCurrentNienKhoa}
                                />
                            </>
                        )}
                    </div>
                </Card.Body>

                {!isFetchingStudents && filteredAndSearchedStudents.length === 0 && (
                    <Card.Footer className="text-center text-muted p-3">
                        Không tìm thấy học sinh nào phù hợp.
                        {isViewingCurrentNienKhoa && !searchTerm && !filterKhoi && (
                            <Button
                                variant="link"
                                onClick={() => handleShowModal('create')}
                                className="p-0 ms-1"
                            >
                                Thêm học sinh mới?
                            </Button>
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
                />
            )}
        </Container>
    );
};

export default StudentManagement;