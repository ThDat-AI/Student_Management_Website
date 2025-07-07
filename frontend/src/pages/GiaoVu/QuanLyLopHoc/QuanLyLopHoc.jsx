import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Alert, Form, Card, Spinner, InputGroup } from 'react-bootstrap';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useLayout } from '../../../contexts/LayoutContext';
import useDebounce from '../../../hooks/useDebounce'; 
import api from '../../../api';
import { toast } from 'react-toastify'; // Sử dụng toast cho thông báo thành công

// Import các component con
import LopHocTable from './components/LopHocTable';
import LopHocModal from './components/LopHocModal';
import MonHocModal from './components/MonHocModal';
import confirmDelete from '../../../components/ConfirmDelete';


const parseApiError = (error) => {
    // 1. Lỗi mạng hoặc lỗi không xác định
    if (!error.response) {
        return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền mạng.";
    }
    const data = error.response.data;
    // 2. Lỗi có key 'detail' (phổ biến nhất cho lỗi quyền, không tìm thấy,...)
    if (data && typeof data.detail === 'string') {
        return data.detail;
    }
    // 3. Lỗi validation (là một object, ví dụ: { "TenLop": ["..."], "IDKhoi": ["..."] })
    if (data && typeof data === 'object') {
        // Lấy tất cả các thông báo lỗi từ các trường và nối chúng lại thành một chuỗi
        const messages = Object.values(data).flat().join(' ');
        if (messages) {
            return messages;
        }
    }
    // 4. Trường hợp mặc định nếu không khớp các dạng trên
    return 'Thao tác thất bại. Đã có lỗi không xác định xảy ra.';
};


const QuanLyLopHoc = () => {
    const { setPageTitle } = useLayout();
    const [lopHocList, setLopHocList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Chỉ dùng cho lỗi toàn trang (lỗi fetch, lỗi xóa)
    
    // Các state khác...
    const [filters, setFilters] = useState({ searchTerm: '', nienKhoa: '', khoi: '', toHop: '' });
    const [dropdowns, setDropdowns] = useState({ nienKhoas: [], khois: [], toHops: [] });
    const [showLopHocModal, setShowLopHocModal] = useState(false);
    const [showMonHocModal, setShowMonHocModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedLopHoc, setSelectedLopHoc] = useState(null);

    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    // Phần fetch dữ liệu không thay đổi
    useEffect(() => {
        document.title = "Quản lý lớp học";
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
            const params = { search: debouncedSearchTerm, IDNienKhoa: filters.nienKhoa, IDKhoi: filters.khoi, IDToHop: filters.toHop };
            const res = await api.get('/api/classes/lophoc/', { params });
            setLopHocList(res.data.results || res.data);
        } catch (err) {
            setError('Không thể tải danh sách lớp học.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, filters.nienKhoa, filters.khoi, filters.toHop]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    
    // Phần mở modal không thay đổi, vốn đã đúng
    const handleShowCreateModal = () => { setModalMode('create'); setSelectedLopHoc(null); setShowLopHocModal(true); };
    const handleShowEditModal = (lop) => { setModalMode('edit'); setSelectedLopHoc(lop); setShowLopHocModal(true); };
    const handleShowMonHocModal = (lop) => { setSelectedLopHoc(lop); setShowMonHocModal(true); };


    const handleSubmitLopHoc = async (formData, lopHocId) => {
        try {
            if (modalMode === 'create') {
                await api.post('/api/classes/lophoc/', formData);
                toast.success('Thêm lớp học thành công!');
            } else {
                await api.patch(`/api/classes/lophoc/${lopHocId}/`, formData);
                toast.success('Cập nhật lớp học thành công!');
            }
            setShowLopHocModal(false);
            fetchData();
            return { success: true };
        } catch (err) {
            const errorMessage = parseApiError(err);
            return { success: false, error: errorMessage };
        }
    };
    
    const handleSubmitMonHoc = async (lopHocId, monhocData) => {
        try {
            await api.post(`/api/classes/lophoc/${lopHocId}/monhoc/`, monhocData);
            toast.success('Cập nhật môn học cho lớp thành công!');
            setShowMonHocModal(false);
            fetchData();
            return { success: true };
        } catch (err) {
            const errorMessage = parseApiError(err);
            return { success: false, error: errorMessage };
        }
    };

    const handleDelete = async (lop) => {
        const isConfirmed = await confirmDelete(`Bạn có chắc muốn xóa lớp học "${lop.TenLop}"?`);
        if (!isConfirmed) return;
        try {
            await api.delete(`/api/classes/lophoc/${lop.id}/`);
            toast.success('Xóa lớp học thành công.');
            fetchData();
        } catch (err) {
            const errorMessage = parseApiError(err);
            setError(errorMessage);
        }
    };

    // Phần JSX render không thay đổi
    return (
        <Container fluid className="py-4">
            <h2 className="h4 mb-4">Quản lý Lớp học</h2>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {/* Bỏ Alert success, dùng toast */}
            
            <Card className="shadow-sm">
                <Card.Header className="p-3 bg-white">
                    <Row className="g-2 align-items-center">
                        <Col lg={4}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control name="searchTerm" placeholder="Tìm theo tên lớp..." onChange={handleFilterChange} /></InputGroup></Col>
                        <Col lg={6}><Row className="g-2"><Col><Form.Select name="nienKhoa" onChange={handleFilterChange}><option value="">Lọc theo niên khóa</option>{dropdowns.nienKhoas.map(nk => <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>)}</Form.Select></Col><Col><Form.Select name="khoi" onChange={handleFilterChange}><option value="">Lọc theo khối</option>{dropdowns.khois.map(k => <option key={k.id} value={k.id}>{k.TenKhoi}</option>)}</Form.Select></Col><Col><Form.Select name="toHop" onChange={handleFilterChange}><option value="">Lọc theo tổ hợp</option>{dropdowns.toHops.map(th => <option key={th.id} value={th.id}>{th.TenToHop}</option>)}</Form.Select></Col></Row></Col>
                        <Col lg={2} className="text-end"><Button variant="primary" onClick={handleShowCreateModal}><FaPlus /> Thêm mới</Button></Col>
                    </Row>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (<div className="text-center py-5"><Spinner animation="border" /></div>) : (lopHocList.length > 0 ? (<LopHocTable lopHocList={lopHocList} onEdit={handleShowEditModal} onDelete={handleDelete} onManageSubjects={handleShowMonHocModal} />) : (<div className="text-center p-5 text-muted">Không có dữ liệu.</div>))}
                </Card.Body>
            </Card>

            {showLopHocModal && <LopHocModal show={showLopHocModal} onHide={() => setShowLopHocModal(false)} onSubmit={handleSubmitLopHoc} lopHocData={selectedLopHoc} modalMode={modalMode} />}
            {showMonHocModal && <MonHocModal show={showMonHocModal} onHide={() => setShowMonHocModal(false)} onSubmit={handleSubmitMonHoc} lopHocData={selectedLopHoc} />}
        </Container>
    );
};

export default QuanLyLopHoc;