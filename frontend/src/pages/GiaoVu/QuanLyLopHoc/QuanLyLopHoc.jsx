// src/pages/GiaoVu/QuanLyLopHoc/QuanLyLopHoc.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Alert, Form, Card, Spinner, InputGroup } from 'react-bootstrap';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { useLayout } from '../../../contexts/LayoutContext';
import useDebounce from '../../../hooks/useDebounce'; 
import api from '../../../api';
import LopHocTable from './components/LopHocTable';
import LopHocModal from './components/LopHocModal';
import MonHocModal from './components/MonHocModal';
import confirmDelete from '../../../components/ConfirmDelete';

const QuanLyLopHoc = () => {
    const { setPageTitle } = useLayout();
    const [lopHocList, setLopHocList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filters, setFilters] = useState({ searchTerm: '', nienKhoa: '', khoi: '', toHop: '' });
    const [dropdowns, setDropdowns] = useState({ nienKhoas: [], khois: [], toHops: [] });
    
    const [showLopHocModal, setShowLopHocModal] = useState(false);
    const [showMonHocModal, setShowMonHocModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedLopHoc, setSelectedLopHoc] = useState(null);

    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    useEffect(() => {
        setPageTitle("Quản lý lớp học");
        const fetchDropdowns = async () => {
            try {
                const [nkRes, kRes, thRes] = await Promise.all([
                    api.get('/api/configurations/nienkhoa-list/'),
                    api.get('/api/classes/khoi/'),
                    api.get('/api/subjects/tohop/')
                ]);
                setDropdowns({ nienKhoas: nkRes.data, khois: kRes.data, toHops: thRes.data });
            } catch (err) {
                setError('Không thể tải dữ liệu cho các bộ lọc.');
            }
        };
        fetchDropdowns();
    }, [setPageTitle]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                search: debouncedSearchTerm,
                IDNienKhoa: filters.nienKhoa,
                IDKhoi: filters.khoi,
                IDToHop: filters.toHop
            };
            const res = await api.get('/api/classes/lophoc/', { params });
            setLopHocList(res.data.results || res.data); // Hỗ trợ cả pagination và list thường
        } catch (err) {
            setError('Không thể tải danh sách lớp học.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, filters.nienKhoa, filters.khoi, filters.toHop]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleShowCreateModal = () => {
        setModalMode('create');
        setSelectedLopHoc(null);
        setShowLopHocModal(true);
    };

    const handleShowEditModal = (lop) => {
        setModalMode('edit');
        setSelectedLopHoc(lop);
        setShowLopHocModal(true);
    };

    const handleShowMonHocModal = (lop) => {
        setSelectedLopHoc(lop);
        setShowMonHocModal(true);
    };

    const handleSubmitLopHoc = async (formData, lopHocId) => {
        try {
            if (modalMode === 'create') {
                await api.post('/api/classes/lophoc/', formData);
                setSuccess('Thêm lớp học thành công!');
            } else {
                await api.patch(`/api/classes/lophoc/${lopHocId}/`, formData);
                setSuccess('Cập nhật lớp học thành công!');
            }
            setShowLopHocModal(false);
            fetchData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.detail || 'Thao tác thất bại.' };
        }
    };
    
    const handleSubmitMonHoc = async (lopHocId, monhocData) => {
        try {
            await api.post(`/api/classes/lophoc/${lopHocId}/monhoc/`, monhocData);
            setSuccess('Cập nhật môn học cho lớp thành công!');
            setShowMonHocModal(false);
            fetchData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.detail || 'Thao tác thất bại.' };
        }
    };

    const handleDelete = async (lop) => {
        const isConfirmed = await confirmDelete(`Bạn có chắc muốn xóa lớp học "${lop.TenLop}"?`);
        if (!isConfirmed) return;
        {
            try {
                await api.delete(`/api/classes/lophoc/${lop.id}/`);
                setSuccess('Xóa lớp học thành công.');
                // Xóa lỗi cũ nếu có để tránh hiển thị lỗi cũ khi thành công
                setError(''); 
                fetchData();
            } catch (err) {
                // --- CẬP NHẬT LOGIC XỬ LÝ LỖI ---
                let errorMessage = 'Xóa thất bại. Đã có lỗi xảy ra.'; // Một thông báo mặc định tốt hơn

                if (err.response && err.response.data) {
                    const errorData = err.response.data;

                    // Trường hợp 1: Lỗi có key 'detail' (phổ biến nhất)
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail;
                    }
                    // Trường hợp 2: Lỗi validation (là một object)
                    // Ví dụ: { "TenLop": ["Tên lớp đã tồn tại."] }
                    else if (typeof errorData === 'object') {
                        // Lấy tất cả các thông báo lỗi từ các trường và nối chúng lại
                        const messages = Object.values(errorData).flat().join(' ');
                        if (messages) {
                            errorMessage = messages;
                        }
                    }
                } 
                // Có thể thêm trường hợp lỗi mạng ở đây
                else if (err.request) {
                    errorMessage = "Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền mạng.";
                }

                setError(errorMessage);
                // Xóa thông báo thành công nếu có
                setSuccess('');
            }
        }
    };

    return (
        <Container fluid className="py-4">
            <h2 className="h4 mb-4">Quản lý Lớp học</h2>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <Card className="shadow-sm">
                <Card.Header className="p-3 bg-white">
                    <Row className="g-2 align-items-center">
                        <Col lg={4}>
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control name="searchTerm" placeholder="Tìm theo tên lớp..." onChange={handleFilterChange} />
                            </InputGroup>
                        </Col>
                        <Col lg={6}>
                            <Row className="g-2">
                                <Col><Form.Select name="nienKhoa" onChange={handleFilterChange}><option value="">Lọc theo niên khóa</option>{dropdowns.nienKhoas.map(nk => <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>)}</Form.Select></Col>
                                <Col><Form.Select name="khoi" onChange={handleFilterChange}><option value="">Lọc theo khối</option>{dropdowns.khois.map(k => <option key={k.id} value={k.id}>{k.TenKhoi}</option>)}</Form.Select></Col>
                                <Col><Form.Select name="toHop" onChange={handleFilterChange}><option value="">Lọc theo tổ hợp</option>{dropdowns.toHops.map(th => <option key={th.id} value={th.id}>{th.TenToHop}</option>)}</Form.Select></Col>
                            </Row>
                        </Col>
                        <Col lg={2} className="text-end">
                            <Button variant="primary" onClick={handleShowCreateModal}><FaPlus /> Thêm mới</Button>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : (
                        lopHocList.length > 0 ? (
                            <LopHocTable lopHocList={lopHocList} onEdit={handleShowEditModal} onDelete={handleDelete} onManageSubjects={handleShowMonHocModal} />
                        ) : (
                            <div className="text-center p-5 text-muted">Không có dữ liệu.</div>
                        )
                    )}
                </Card.Body>
            </Card>

            {showLopHocModal && <LopHocModal show={showLopHocModal} onHide={() => setShowLopHocModal(false)} onSubmit={handleSubmitLopHoc} lopHocData={selectedLopHoc} modalMode={modalMode} />}
            {showMonHocModal && <MonHocModal show={showMonHocModal} onHide={() => setShowMonHocModal(false)} onSubmit={handleSubmitMonHoc} lopHocData={selectedLopHoc} />}
        </Container>
    );
};

export default QuanLyLopHoc;