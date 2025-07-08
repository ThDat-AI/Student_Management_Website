// src/pages/GiaoVu/XemDanhSachLop/DanhSachLop.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Table } from 'react-bootstrap';
import { FaFileExcel } from 'react-icons/fa';
import { useLayout } from '../../contexts/LayoutContext';
import api from '../../api';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

const DanhSachLop = () => {
    const { setPageTitle } = useLayout();
    const [nienKhoaOptions, setNienKhoaOptions] = useState([]);
    const [lopHocOptions, setLopHocOptions] = useState([]);
    const [selectedNienKhoa, setSelectedNienKhoa] = useState('');
    const [selectedLopHoc, setSelectedLopHoc] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    // const [error, setError] = useState(''); // Đã loại bỏ, thay bằng toast

    const [selectedLopInfo, setSelectedLopInfo] = useState(null);

    useEffect(() => {
        document.title = "Xem danh sách lớp";
        setPageTitle("Xem danh sách lớp");
        const fetchNienKhoas = async () => {
            try {
                const res = await api.get('/api/configurations/nienkhoa-list/');
                setNienKhoaOptions(res.data);
            } catch (err) { 
                toast.error("Không thể tải danh sách niên khóa.");
            }
        };
        fetchNienKhoas();
    }, [setPageTitle]);

    useEffect(() => {
        if (selectedNienKhoa) {
            const fetchLopHoc = async () => {
                try {
                    const res = await api.get(`/api/classes/lophoc-list/?nienkhoa_id=${selectedNienKhoa}`);
                    setLopHocOptions(res.data);
                } catch (err) { 
                    toast.error("Không thể tải danh sách lớp học.");
                }
            };
            fetchLopHoc();
        } else { 
            setLopHocOptions([]); 
        }
        setSelectedLopHoc('');
        setStudents([]);
        setSelectedLopInfo(null);
    }, [selectedNienKhoa]);

    const fetchStudents = useCallback(async () => {
        if (!selectedLopHoc) { 
            setStudents([]); 
            setSelectedLopInfo(null);
            return; 
        }

        const lopInfo = lopHocOptions.find(lop => lop.id === parseInt(selectedLopHoc));
        setSelectedLopInfo(lopInfo);
        
        setLoading(true);
        try {
            const res = await api.get(`/api/classes/lophoc/danh-sach-json/?lophoc_id=${selectedLopHoc}`);
            setStudents(res.data);
            if (res.data.length > 0) {
                toast.success(`Tải thành công danh sách lớp ${lopInfo?.TenLop}.`);
            } else {
                toast.info(`Lớp ${lopInfo?.TenLop} hiện chưa có học sinh.`);
            }
        } catch (err) {
            toast.error("Không thể tải dữ liệu học sinh.");
            setStudents([]); // Xóa dữ liệu cũ nếu có lỗi
        } finally {
            setLoading(false);
        }
    }, [selectedLopHoc, lopHocOptions]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get(`/api/classes/lophoc/xuat-danh-sach/?lophoc_id=${selectedLopHoc}`, { responseType: 'blob' });
            const contentDisposition = response.headers['content-disposition'];
            let filename = "Danh_sach_lop.xlsx";
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/);
                if (filenameMatch && filenameMatch.length > 1) { 
                    filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
                }
            }
            saveAs(response.data, filename);
            toast.success("Xuất file thành công!");
        } catch (err) {
            toast.error("Xuất file thất bại. Lớp có thể không có dữ liệu để xuất.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Container fluid>
            <Card className="mt-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    <span>
                        Xem Danh Sách Lớp
                        {selectedLopInfo && (
                            <span className='fw-normal fs-6 ms-2'>
                                - {selectedLopInfo.TenLop} (Sĩ số: {selectedLopInfo.SiSo})
                            </span>
                        )}
                    </span>
                    <Button variant="success" onClick={handleExport} disabled={!selectedLopHoc || isExporting || students.length === 0}>
                        {isExporting ? <Spinner as="span" animation="border" size="sm" /> : <FaFileExcel />}
                        <span className="ms-2">{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3 g-2">
                        <Col md={6}><Form.Select value={selectedNienKhoa} onChange={(e) => setSelectedNienKhoa(e.target.value)}><option value="">-- Chọn niên khóa --</option>{nienKhoaOptions.map(nk => <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>)}</Form.Select></Col>
                        <Col md={6}><Form.Select value={selectedLopHoc} onChange={(e) => setSelectedLopHoc(e.target.value)} disabled={!selectedNienKhoa}><option value="">-- Chọn lớp học --</option>{lopHocOptions.map(lop => <option key={lop.id} value={lop.id}>{lop.TenLop}</option>)}</Form.Select></Col>
                    </Row>
                    
                    {/* Component Alert đã được xóa khỏi đây */}

                    <Table striped bordered hover responsive>
                        <thead className="table-light">
                            <tr>
                                <th>STT</th>
                                <th>Họ và Tên</th>
                                <th>Giới tính</th>
                                <th>Ngày sinh</th>
                                <th>Email</th>
                                <th>Địa chỉ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan="6" className="text-center p-4"><Spinner animation="border" /></td></tr>)
                            : students.length > 0 ? (
                                students.map((hs, index) => (
                                    <tr key={hs.id}>
                                        <td>{index + 1}</td>
                                        <td>{`${hs.Ho} ${hs.Ten}`}</td>
                                        <td>{hs.GioiTinh}</td>
                                        <td>{new Date(hs.NgaySinh).toLocaleDateString('vi-VN')}</td>
                                        <td>{hs.Email || <span className="text-muted">-</span>}</td>
                                        <td>{hs.DiaChi}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center text-muted p-4">{selectedLopHoc ? 'Lớp không có học sinh.' : 'Vui lòng chọn lớp để xem danh sách.'}</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DanhSachLop;