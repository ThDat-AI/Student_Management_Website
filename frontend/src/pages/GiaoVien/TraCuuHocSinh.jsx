// src/pages/HocSinh/TraCuuHocSinh.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Table, Spinner, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useLayout } from '../../contexts/LayoutContext';
import useDebounce from '../../hooks/useDebounce';
import api from '../../api';
import { toast } from 'react-toastify';

const TraCuuHocSinh = () => {
    const { setPageTitle } = useLayout();

    
    const [nienKhoaOptions, setNienKhoaOptions] = useState([]);
    const [khoiOptions, setKhoiOptions] = useState([]);
    const [allLopHocOptions, setAllLopHocOptions] = useState([]); 
    
    const [selectedNienKhoa, setSelectedNienKhoa] = useState('');
    const [selectedKhoi, setSelectedKhoi] = useState('');
    const [selectedLopHoc, setSelectedLopHoc] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        document.title = "Tra cứu học sinh";
        setPageTitle("Tra cứu học sinh");
        
        const fetchInitialData = async () => {
            try {
                const [nienKhoaRes, khoiRes] = await Promise.all([
                    api.get('/api/configurations/nienkhoa-list/'),
                    api.get('/api/configurations/khoi-list/')
                ]);
                setNienKhoaOptions(nienKhoaRes.data);
                setKhoiOptions(khoiRes.data);
            } catch (err) {
                toast.error("Không thể tải dữ liệu bộ lọc ban đầu.");
            }
        };
        fetchInitialData();
    }, [setPageTitle]);

    // Tải danh sách lớp học khi niên khóa thay đổi
    useEffect(() => {
        setSelectedKhoi('');
        setSelectedLopHoc('');
        setAllLopHocOptions([]);

        if (selectedNienKhoa) {
            const fetchLopHoc = async () => {
                try {
                    const res = await api.get(`/api/classes/lophoc-list/?nienkhoa_id=${selectedNienKhoa}`);
                    setAllLopHocOptions(res.data);
                } catch (err) {
                    toast.error("Không thể tải danh sách lớp học.");
                }
            };
            fetchLopHoc();
        }
    }, [selectedNienKhoa]);
    
    // Lọc danh sách lớp học dựa trên khối đã chọn (client-side)
    const filteredLopOptions = useMemo(() => {
        if (!selectedKhoi) {
            return allLopHocOptions;
        }
        return allLopHocOptions.filter(lop => lop.IDKhoi === parseInt(selectedKhoi));
    }, [selectedKhoi, allLopHocOptions]);

    // Tải danh sách học sinh khi bộ lọc thay đổi
    const fetchStudents = useCallback(async () => {
        if (!selectedNienKhoa) {
            setStudents([]);
            return;
        }

        setLoading(true);
        try {
            const params = {
                nien_khoa_id: selectedNienKhoa,
                khoi_id: selectedKhoi || undefined,
                lophoc_id: selectedLopHoc || undefined,
                search: debouncedSearchTerm,
            };
            const res = await api.get('/api/students/tra-cuu/', { params });
            const results = res.data.results || res.data || [];
            setStudents(results);

            // Thêm toast thông báo kết quả
            if (results.length > 0) {
                toast.success(`Tìm thấy ${results.length} học sinh.`);
            } else {
                // Chỉ thông báo khi có các bộ lọc, tránh thông báo lúc đầu
                if (selectedLopHoc || debouncedSearchTerm) {
                   toast.info("Không tìm thấy học sinh nào phù hợp.");
                }
            }
        } catch (err) {
            toast.error("Không thể tải dữ liệu học sinh.");
            setStudents([]); // Xóa dữ liệu cũ khi có lỗi
        } finally {
            setLoading(false);
        }
    }, [selectedNienKhoa, selectedKhoi, selectedLopHoc, debouncedSearchTerm]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);
    
    const formatDiem = (diem) => {
        if (diem === null || diem === undefined) {
            return <span className="text-muted">-</span>;
        }
        return diem.toFixed(1);
    }

    return (
        <Container fluid>
            <Card className="mt-4">
                <Card.Header as="h5">Tra cứu thông tin học sinh</Card.Header>
                <Card.Body>
                    <Row className="mb-3 g-2 align-items-end">
                        {/* BỘ LỌC */}
                        <Col md={3}><Form.Group><Form.Label>Niên khóa</Form.Label><Form.Select value={selectedNienKhoa} onChange={(e) => setSelectedNienKhoa(e.target.value)}><option value="">-- Chọn niên khóa --</option>{nienKhoaOptions.map(nk => <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>)}</Form.Select></Form.Group></Col>
                        <Col md={2}><Form.Group><Form.Label>Khối</Form.Label><Form.Select value={selectedKhoi} onChange={(e) => {setSelectedKhoi(e.target.value); setSelectedLopHoc('');}} disabled={!selectedNienKhoa}><option value="">Tất cả khối</option>{khoiOptions.map(k => <option key={k.id} value={k.id}>{k.TenKhoi}</option>)}</Form.Select></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label>Lớp học</Form.Label><Form.Select value={selectedLopHoc} onChange={(e) => setSelectedLopHoc(e.target.value)} disabled={!selectedNienKhoa}><option value="">Tất cả lớp</option>{filteredLopOptions.map(lop => <option key={lop.id} value={lop.id}>{lop.TenLop}</option>)}</Form.Select></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label>Tìm kiếm học sinh</Form.Label><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control type="text" placeholder="Nhập họ tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!selectedNienKhoa} /></InputGroup></Form.Group></Col>
                    </Row>
                    
                    {/* BẢNG KẾT QUẢ */}
                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Họ Tên</th>
                                    <th>Giới tính</th>
                                    <th>Ngày sinh</th>
                                    <th>Email</th>
                                    <th>Lớp</th>
                                    <th>Điểm TB HK1</th>
                                    <th>Điểm TB HK2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center p-4"><Spinner animation="border" /></td></tr>
                                ) : students.length > 0 ? (
                                    students.map((student, index) => (
                                        <tr key={student.id}>
                                            <td>{index + 1}</td>
                                            <td>{student.HoTen}</td>
                                            <td>{student.GioiTinh}</td>
                                            <td>{student.NgaySinh}</td>
                                            <td>{student.Email || '-'}</td>
                                            <td>{student.TenLop || <span className="text-muted">Chưa xếp lớp</span>}</td>
                                            <td>{formatDiem(student.DiemTB_HK1)}</td>
                                            <td>{formatDiem(student.DiemTB_HK2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted p-4">
                                            {!selectedNienKhoa ? 'Vui lòng chọn niên khóa để bắt đầu tra cứu.' : 'Không tìm thấy học sinh nào phù hợp.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default TraCuuHocSinh;