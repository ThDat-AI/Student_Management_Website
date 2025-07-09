import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { FaSearch, FaListAlt } from 'react-icons/fa';
import { useLayout } from '../../../contexts/LayoutContext';
import api from '../../../api/index';
import { toast } from 'react-toastify';
import { useDebounce } from 'use-debounce';
import QuanLyHocSinhLopModal from './components/QuanLyHocSinhLopModal';

const LapDanhSachLop = () => {
    const { setPageTitle } = useLayout();
    
    // State dữ liệu
    const [lopHocList, setLopHocList] = useState([]);
    const [dropdowns, setDropdowns] = useState({ nienKhoas: [], khois: [] });

    // State bộ lọc
    const [filters, setFilters] = useState({ nienKhoaId: null, khoiId: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    // State quản lý trạng thái tải
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    
    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedLop, setSelectedLop] = useState(null);

    // Effect 1: Thiết lập tiêu đề trang
    useEffect(() => {
        document.title = "Lập danh sách lớp";
        setPageTitle('Lập danh sách lớp');
    }, [setPageTitle]);

    // Effect 2: Tải dữ liệu dropdown và thiết lập giá trị ban đầu (chạy 1 lần)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [nienKhoaRes, khoiRes] = await Promise.all([
                    api.get('/api/configurations/nienkhoa-list/'),
                    api.get('/api/configurations/khoi-list/')
                ]);
                const fetchedNienKhoas = nienKhoaRes.data;
                setDropdowns({ nienKhoas: fetchedNienKhoas, khois: khoiRes.data });

                const current = fetchedNienKhoas.find(nk => nk.is_current);
                const initialNienKhoaId = current?.id || fetchedNienKhoas[0]?.id || null;

                if (initialNienKhoaId) {
                    setFilters(prev => ({ ...prev, nienKhoaId: initialNienKhoaId }));
                } else {
                    toast.warn("Chưa có niên khóa nào trong hệ thống.");
                }
            } catch (err) {
                toast.error('Không thể tải dữ liệu niên khóa và khối.');
            } finally {
                setInitialLoading(false); // Hoàn thành tải ban đầu
            }
        };
        fetchInitialData();
    }, []);

    // Effect 3: Fetch danh sách lớp học khi bộ lọc thay đổi
    useEffect(() => {
        // Không chạy khi đang tải lần đầu hoặc khi chưa có ID niên khóa
        if (initialLoading || !filters.nienKhoaId) return;

        const fetchLopHoc = async () => {
            setTableLoading(true);
            try {
                const params = {
                    IDNienKhoa: filters.nienKhoaId,
                    IDKhoi: filters.khoiId || undefined,
                    search: debouncedSearchTerm || undefined,
                };
                const res = await api.get('/api/classes/lophoc/', { params });
                setLopHocList(res.data.results || res.data);
            } catch (err) {
                toast.error('Không thể tải danh sách lớp học.');
                setLopHocList([]);
            } finally {
                setTableLoading(false);
            }
        };

        fetchLopHoc();
    }, [filters.nienKhoaId, filters.khoiId, debouncedSearchTerm, initialLoading]);

    // Tính toán giá trị phái sinh trực tiếp để tránh lỗi "nhấp nháy"
    const currentNienKhoaFromDropdowns = dropdowns.nienKhoas.find(nk => nk.is_current);
    const isViewingCurrentNienKhoa = currentNienKhoaFromDropdowns?.id === Number(filters.nienKhoaId);

    // Handlers
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

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
        // Gọi lại fetchLopHoc để cập nhật sĩ số
        const fetchAgain = async () => {
            setTableLoading(true);
            try {
                const params = { IDNienKhoa: filters.nienKhoaId, IDKhoi: filters.khoiId, search: debouncedSearchTerm };
                const res = await api.get('/api/classes/lophoc/', { params });
                setLopHocList(res.data.results || res.data);
            } catch (err) {
                toast.error('Lỗi khi tải lại danh sách lớp.');
            } finally {
                setTableLoading(false);
            }
        };
        fetchAgain();
    };

    // Render loading toàn trang
    if (initialLoading) {
        return (
            <Container fluid className="py-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Đang tải cấu hình...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <Card>
                <Card.Header as="h5">Lập danh sách lớp</Card.Header>
                <Card.Body>
                    <Row className="mb-3 g-2 align-items-end">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Niên khóa</Form.Label>
                                <Form.Select name="nienKhoaId" value={filters.nienKhoaId || ''} onChange={handleFilterChange}>
                                    {dropdowns.nienKhoas.map(nk => (
                                        <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}{nk.is_current ? " (Hiện hành)" : ""}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Khối</Form.Label>
                                <Form.Select name="khoiId" value={filters.khoiId} onChange={handleFilterChange}>
                                    <option value="">Tất cả các khối</option>
                                    {dropdowns.khois.map(k => (
                                        <option key={k.id} value={k.id}>{k.TenKhoi}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
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
                    
                    {!isViewingCurrentNienKhoa && filters.nienKhoaId && (
                        <Alert variant="warning">
                            Bạn đang xem dữ liệu của một niên khóa cũ. Chức năng sửa danh sách đã bị vô hiệu hóa.
                        </Alert>
                    )}

                    {tableLoading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tên Lớp</th>
                                    <th>Khối</th>
                                    <th>Niên Khóa</th>
                                    <th>Sĩ Số</th>
                                    <th className="text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lopHocList.length > 0 ? (
                                    lopHocList.map((lop, index) => (
                                        <tr key={lop.id}>
                                            <td>{index + 1}</td>
                                            <td>{lop.TenLop}</td>
                                            <td>{lop.TenKhoi}</td>
                                            <td>{lop.TenNienKhoa}</td>
                                            <td>{lop.SiSo}</td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    onClick={() => handleOpenModal(lop)}
                                                    disabled={!lop.is_editable}
                                                    title={lop.is_editable ? "Sửa danh sách học sinh" : "Chỉ có thể sửa ở niên khóa hiện hành"}
                                                >
                                                    <FaListAlt className="me-1" /> Sửa danh sách
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