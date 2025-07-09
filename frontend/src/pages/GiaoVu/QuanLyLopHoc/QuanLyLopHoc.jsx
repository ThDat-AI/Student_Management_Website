import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, Alert, Form, Card, Spinner, InputGroup } from 'react-bootstrap';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useLayout } from '../../../contexts/LayoutContext';
import { useDebounce } from 'use-debounce';
import api from '../../../api';
import { toast } from 'react-toastify';

import LopHocTable from './components/LopHocTable';
import LopHocModal from './components/LopHocModal';
import MonHocModal from './components/MonHocModal';
import confirmDelete from '../../../components/ConfirmDelete';

// Hàm helper để parse lỗi từ API
const parseApiError = (error) => {
    if (!error.response) return "Lỗi kết nối máy chủ.";
    const data = error.response.data;
    if (data?.detail) return data.detail;
    if (typeof data === 'object') return Object.values(data).flat().join(' ');
    return 'Lỗi không xác định.';
};

const QuanLyLopHoc = () => {
    // Context và state cơ bản
    const { setPageTitle } = useLayout();
    const [lopHocList, setLopHocList] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho các dropdown và bộ lọc
    const [dropdowns, setDropdowns] = useState({ nienKhoas: [], khois: [], toHops: [] });
    const [filters, setFilters] = useState({ searchTerm: '', nienKhoa: '', khoi: '', toHop: '' });
    const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);
    
    // State cho modals
    const [showLopHocModal, setShowLopHocModal] = useState(false);
    const [showMonHocModal, setShowMonHocModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedLopHoc, setSelectedLopHoc] = useState(null);

    // Ref cho optimistic updates
    const previousLopHocList = useRef([]);

    // Effect 1: Thiết lập tiêu đề trang
    useEffect(() => {
        document.title = "Quản lý lớp học";
        setPageTitle("Quản lý lớp học");
    }, [setPageTitle]);

    // Effect 2: Tải dữ liệu cho các dropdown chỉ một lần
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [nkRes, kRes, thRes] = await Promise.all([
                    api.get('/api/configurations/nienkhoa-list/'),
                    api.get('/api/classes/khoi/'),
                    api.get('/api/subjects/tohop/')
                ]);
                const fetchedNienKhoas = nkRes.data;
                setDropdowns({ nienKhoas: fetchedNienKhoas, khois: kRes.data, toHops: thRes.data });

                const current = fetchedNienKhoas.find(nk => nk.is_current);
                const initialNienKhoaId = current?.id || fetchedNienKhoas[0]?.id || '';
                
                if (initialNienKhoaId) {
                    setFilters(prev => ({ ...prev, nienKhoa: initialNienKhoaId }));
                } else {
                    toast.warn("Không có niên khóa nào trong hệ thống. Vui lòng tạo trước.");
                    setLoading(false);
                }
            } catch (err) {
                toast.error('Không thể tải dữ liệu cho các bộ lọc.');
                setLoading(false);
            }
        };
        fetchDropdowns();
    }, []);

    // Effect 3: Fetch danh sách lớp học khi bộ lọc thay đổi
    useEffect(() => {
        if (!filters.nienKhoa) {
            setLopHocList([]);
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = { 
                    search: debouncedSearchTerm, 
                    IDNienKhoa: filters.nienKhoa, 
                    IDKhoi: filters.khoi, 
                    IDToHop: filters.toHop 
                };
                const res = await api.get('/api/classes/lophoc/', { params });
                setLopHocList(res.data.results || res.data);
            } catch (err) {
                toast.error('Không thể tải danh sách lớp học.');
                setLopHocList([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [debouncedSearchTerm, filters.nienKhoa, filters.khoi, filters.toHop]);

    // === TÍNH TOÁN GIÁ TRỊ PHÁI SINH TRỰC TIẾP KHI RENDER ===
    // Đây là cách giải quyết lỗi "nhấp nháy"
    const currentNienKhoaFromDropdowns = dropdowns.nienKhoas.find(nk => nk.is_current);
    const isViewingCurrentNienKhoa = currentNienKhoaFromDropdowns?.id === Number(filters.nienKhoa);

    // === HANDLERS ===
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleShowCreateModal = () => { setModalMode('create'); setSelectedLopHoc(null); setShowLopHocModal(true); };
    const handleShowEditModal = (lop) => { setModalMode('edit'); setSelectedLopHoc(lop); setShowLopHocModal(true); };
    const handleShowMonHocModal = (lop) => { setSelectedLopHoc(lop); setShowMonHocModal(true); };
    
    const handleSubmitLopHoc = async (formData, lopHocId) => {
        setShowLopHocModal(false);
        previousLopHocList.current = lopHocList;
        if (modalMode === 'create') {
            const tempLop = { id: `temp-${Date.now()}`, ...formData, SiSo: 0, MonHoc: [], is_editable: true, TenKhoi: dropdowns.khois.find(k => k.id === Number(formData.IDKhoi))?.TenKhoi, TenNienKhoa: dropdowns.nienKhoas.find(nk => nk.id === Number(formData.IDNienKhoa))?.TenNienKhoa, TenToHop: dropdowns.toHops.find(th => th.id === Number(formData.IDToHop))?.TenToHop };
            setLopHocList(prev => [tempLop, ...prev]);
            try {
                const res = await api.post('/api/classes/lophoc/', formData);
                setLopHocList(prev => prev.map(l => l.id === tempLop.id ? res.data : l));
                toast.success('Thêm lớp học thành công!');
            } catch (err) {
                toast.error(parseApiError(err));
                setLopHocList(previousLopHocList.current);
            }
        } else {
            const updatedLop = { ...lopHocList.find(l => l.id === lopHocId), ...formData };
            setLopHocList(prev => prev.map(l => l.id === lopHocId ? updatedLop : l));
            try {
                const res = await api.patch(`/api/classes/lophoc/${lopHocId}/`, formData);
                setLopHocList(prev => prev.map(l => l.id === lopHocId ? res.data : l));
                toast.success('Cập nhật lớp học thành công!');
            } catch (err) {
                toast.error(parseApiError(err));
                setLopHocList(previousLopHocList.current);
            }
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
            return { success: false, error: parseApiError(err) };
        }
    };

    const handleDelete = async (lop) => {
        const isConfirmed = await confirmDelete(`Bạn có chắc muốn xóa lớp học "${lop.TenLop}"?`);
        if (!isConfirmed) return;
        
        previousLopHocList.current = lopHocList;
        setLopHocList(prev => prev.filter(l => l.id !== lop.id));
        try {
            await api.delete(`/api/classes/lophoc/${lop.id}/`);
            toast.success('Xóa lớp học thành công.');
        } catch (err) {
            toast.error(parseApiError(err));
            setLopHocList(previousLopHocList.current);
        }
    };

    return (
        <Container fluid className="py-4">
            <h2 className="h4 mb-4">Quản lý Lớp học</h2>
            
            {!isViewingCurrentNienKhoa && filters.nienKhoa && (
                <Alert variant="warning">
                    Bạn đang xem dữ liệu của một niên khóa cũ. Mọi thao tác thêm, sửa, xóa đều bị vô hiệu hóa.
                </Alert>
            )}

            <Card className="shadow-sm">
                <Card.Header className="p-3 bg-white">
                    <Row className="g-2 align-items-center">
                        <Col lg={4}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control name="searchTerm" placeholder="Tìm theo tên lớp..." value={filters.searchTerm} onChange={handleFilterChange} /></InputGroup></Col>
                        <Col lg={6}><Row className="g-2">
                            <Col><Form.Select name="nienKhoa" value={filters.nienKhoa} onChange={handleFilterChange}>{dropdowns.nienKhoas.map(nk => <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}{nk.is_current ? ' (Hiện hành)' : ''}</option>)}</Form.Select></Col>
                            <Col><Form.Select name="khoi" value={filters.khoi} onChange={handleFilterChange}><option value="">Tất cả khối</option>{dropdowns.khois.map(k => <option key={k.id} value={k.id}>{k.TenKhoi}</option>)}</Form.Select></Col>
                            <Col><Form.Select name="toHop" value={filters.toHop} onChange={handleFilterChange}><option value="">Tất cả tổ hợp</option>{dropdowns.toHops.map(th => <option key={th.id} value={th.id}>{th.TenToHop}</option>)}</Form.Select></Col>
                        </Row></Col>
                        <Col lg={2} className="text-end"><Button variant="primary" onClick={handleShowCreateModal} disabled={!isViewingCurrentNienKhoa}><FaPlus /> Thêm mới</Button></Col>
                    </Row>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (<div className="text-center py-5"><Spinner animation="border" /></div>) : (
                        <LopHocTable 
                            lopHocList={lopHocList} 
                            onEdit={handleShowEditModal} 
                            onDelete={handleDelete} 
                            onManageSubjects={handleShowMonHocModal}
                        />
                    )}
                </Card.Body>
                {!loading && lopHocList.length === 0 && (
                     <Card.Footer className="text-center text-muted p-3">Không có lớp học nào phù hợp.</Card.Footer>
                )}
            </Card>

            {showLopHocModal && <LopHocModal show={showLopHocModal} onHide={() => setShowLopHocModal(false)} onSubmit={handleSubmitLopHoc} lopHocData={selectedLopHoc} modalMode={modalMode} dropdowns={dropdowns} />}
            {showMonHocModal && <MonHocModal show={showMonHocModal} onHide={() => setShowMonHocModal(false)} onSubmit={handleSubmitMonHoc} lopHocData={selectedLopHoc} />}
        </Container>
    );
};

export default QuanLyLopHoc;