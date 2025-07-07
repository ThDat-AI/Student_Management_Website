import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Table, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useLayout } from '../../contexts/LayoutContext';
import useDebounce from '../../hooks/useDebounce';
import api from '../../api';

const TraCuuHocSinh = () => {
    const { setPageTitle } = useLayout();

    // State cho bộ lọc
    const [nienKhoaOptions, setNienKhoaOptions] = useState([]);
    const [lopHocOptions, setLopHocOptions] = useState([]);
    const [selectedNienKhoa, setSelectedNienKhoa] = useState('');
    const [selectedLopHoc, setSelectedLopHoc] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // State cho dữ liệu và trạng thái
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = "Tra cứu học sinh";
        setPageTitle("Tra cứu học sinh");
        // Tải danh sách niên khóa lần đầu
        const fetchNienKhoas = async () => {
            try {
                const res = await api.get('/api/configurations/nienkhoa-list/');
                setNienKhoaOptions(res.data);
            } catch (err) {
                setError("Không thể tải danh sách niên khóa.");
            }
        };
        fetchNienKhoas();
    }, [setPageTitle]);

    // Tải danh sách lớp học khi niên khóa thay đổi
    useEffect(() => {
        if (selectedNienKhoa) {
            const fetchLopHoc = async () => {
                try {
                    const res = await api.get(`/api/classes/lophoc-list/?nienkhoa_id=${selectedNienKhoa}`);
                    setLopHocOptions(res.data);
                } catch (err) {
                    setError("Không thể tải danh sách lớp học.");
                }
            };
            fetchLopHoc();
        }
        // Reset danh sách lớp khi không có niên khóa nào được chọn
        else {
            setLopHocOptions([]);
        }
        // Reset lớp được chọn và danh sách học sinh
        setSelectedLopHoc('');
        setStudents([]);
    }, [selectedNienKhoa]);

    // Tải danh sách học sinh khi lớp hoặc từ khóa tìm kiếm thay đổi
    const fetchStudents = useCallback(async () => {
        if (!selectedLopHoc) {
            setStudents([]);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const params = {
                lophoc_id: selectedLopHoc,
                search: debouncedSearchTerm,
            };
            const res = await api.get('/api/students/tra-cuu/', { params });
            setStudents(res.data.results || res.data);
        } catch (err) {
            setError("Không thể tải dữ liệu học sinh.");
        } finally {
            setLoading(false);
        }
    }, [selectedLopHoc, debouncedSearchTerm]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);
    
    // Hàm định dạng điểm
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
                    <Row className="mb-3 g-2">
                        {/* BỘ LỌC */}
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Niên khóa</Form.Label>
                                <Form.Select value={selectedNienKhoa} onChange={(e) => setSelectedNienKhoa(e.target.value)}>
                                    <option value="">-- Chọn niên khóa --</option>
                                    {nienKhoaOptions.map(nk => (
                                        <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Lớp học</Form.Label>
                                <Form.Select value={selectedLopHoc} onChange={(e) => setSelectedLopHoc(e.target.value)} disabled={!selectedNienKhoa}>
                                    <option value="">-- Chọn lớp học --</option>
                                    {lopHocOptions.map(lop => (
                                        <option key={lop.id} value={lop.id}>{lop.TenLop}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Tìm theo tên học sinh</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Nhập tên học sinh..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={!selectedLopHoc}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    {/* BẢNG KẾT QUẢ */}
                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Họ Tên</th>
                                    <th>Lớp</th>
                                    <th>Điểm TB HK1</th>
                                    <th>Điểm TB HK2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center"><Spinner animation="border" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="5"><Alert variant="danger">{error}</Alert></td></tr>
                                ) : students.length > 0 ? (
                                    students.map((student, index) => (
                                        <tr key={student.id}>
                                            <td>{index + 1}</td>
                                            <td>{student.HoTen}</td>
                                            <td>{student.TenLop}</td>
                                            <td>{formatDiem(student.DiemTB_HK1)}</td>
                                            <td>{formatDiem(student.DiemTB_HK2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">
                                            {selectedLopHoc ? 'Không tìm thấy học sinh nào.' : 'Vui lòng chọn lớp để xem thông tin.'}
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