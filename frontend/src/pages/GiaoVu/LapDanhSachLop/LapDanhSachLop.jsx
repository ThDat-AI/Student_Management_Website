// src/pages/GiaoVu/LapDanhSachLop/LapDanhSachLop.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Thêm useMemo
import { Container, Row, Col, Card, Form, Button, Table, Spinner, Alert, InputGroup } from 'react-bootstrap'; // Thêm InputGroup
import { FaSearch } from 'react-icons/fa'; // Thêm icon search
import { useLayout } from '../../../contexts/LayoutContext';
import api from '../../../api/index';
import { toast } from 'react-toastify';
import QuanLyHocSinhLopModal from './components/QuanLyHocSinhLopModal';

const LapDanhSachLop = () => {
    const { setPageTitle } = useLayout();
    const [nienKhoaOptions, setNienKhoaOptions] = useState([]);
    const [khoiOptions, setKhoiOptions] = useState([]);
    const [filters, setFilters] = useState({ nienKhoaId: '', khoiId: '' });
    const [lopHocList, setLopHocList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- STATE MỚI CHO TÌM KIẾM LỚP HỌC ---
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedLop, setSelectedLop] = useState(null);

    useEffect(() => {
        document.title = "Quản lý danh sách lớp";
        setPageTitle('Lập danh sách lớp');
        fetchInitialData();
    }, [setPageTitle]);

    const fetchInitialData = async () => {
        try {
            const [nienKhoaRes, khoiRes] = await Promise.all([
                api.get('/api/configurations/nienkhoa-list/'),
                api.get('/api/configurations/khoi-list/')
            ]);
            setNienKhoaOptions(nienKhoaRes.data);
            setKhoiOptions(khoiRes.data);
            if (nienKhoaRes.data.length > 0) {
                 setFilters(prev => ({ ...prev, nienKhoaId: nienKhoaRes.data[0].id }));
            }
        } catch (err) {
            toast.error('Không thể tải dữ liệu niên khóa và khối.');
        }
    };

    const fetchLopHoc = useCallback(async () => {
        if (!filters.nienKhoaId) return;
        setLoading(true);
        setError(null);
        try {
            const params = {
                IDNienKhoa: filters.nienKhoaId,
                IDKhoi: filters.khoiId || undefined,
            };
            const res = await api.get('/api/classes/lophoc/', { params });
            setLopHocList(res.data);
        } catch (err) {
            setError('Không thể tải danh sách lớp học.');
            toast.error('Không thể tải danh sách lớp học.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLopHoc();
    }, [fetchLopHoc]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // --- LỌC DANH SÁCH LỚP DỰA TRÊN searchTerm ---
    const filteredLopHoc = useMemo(() => {
        if (!searchTerm) {
            return lopHocList;
        }
        return lopHocList.filter(lop => 
            lop.TenLop.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [lopHocList, searchTerm]);
    
    const handleOpenModal = (lop) => {
        setSelectedLop(lop);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedLop(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        toast.success(`Cập nhật danh sách học sinh thành công!`);
        fetchLopHoc(); 
    };

    return (
        <Container fluid>
            <Card className="mt-4">
                <Card.Header as="h5">Lập danh sách lớp</Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        {/* Bộ lọc Niên Khóa và Khối */}
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Niên khóa</Form.Label>
                                <Form.Select name="nienKhoaId" value={filters.nienKhoaId} onChange={handleFilterChange}>
                                    {nienKhoaOptions.map(nk => (
                                        <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Khối</Form.Label>
                                <Form.Select name="khoiId" value={filters.khoiId} onChange={handleFilterChange}>
                                    <option value="">Tất cả các khối</option>
                                    {khoiOptions.map(k => (
                                        <option key={k.id} value={k.id}>{k.TenKhoi}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        {/* --- Ô TÌM KIẾM LỚP HỌC --- */}
                        <Col md={6}>
                           <Form.Group>
                             <Form.Label>Tìm kiếm lớp học</Form.Label>
                             <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Nhập tên lớp để tìm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </InputGroup>
                           </Form.Group>
                        </Col>
                    </Row>
                    
                    {loading && <div className="text-center"><Spinner animation="border" /></div>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    {!loading && !error && (
                        <Table striped bordered hover responsive>
                            <thead>
                                {/* ... thead content ... */}
                            </thead>
                            <tbody>
                                {/* --- SỬ DỤNG filteredLopHoc THAY VÌ lopHocList --- */}
                                {filteredLopHoc.length > 0 ? (
                                    filteredLopHoc.map((lop, index) => (
                                        <tr key={lop.id}>
                                            <td>{index + 1}</td>
                                            <td>{lop.TenLop}</td>
                                            <td>{lop.TenKhoi}</td>
                                            <td>{lop.TenNienKhoa}</td>
                                            <td>{lop.SiSo}</td>
                                            <td>
                                                <Button variant="outline-primary" size="sm" onClick={() => handleOpenModal(lop)}>
                                                    Sửa danh sách
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center">Không tìm thấy lớp học nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {selectedLop && (
                <QuanLyHocSinhLopModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    lopHocId={selectedLop.id}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
        </Container>
    );
};

export default LapDanhSachLop;