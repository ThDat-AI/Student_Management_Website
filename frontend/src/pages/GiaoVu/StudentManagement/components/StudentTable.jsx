import React from 'react';
import { Table, Button, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const StudentTable = ({ students, onEdit, onDelete, isReadOnly }) => {
    return (
        <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                    <tr>
                        <th>#</th>
                        <th>Họ tên</th>
                        <th>Giới tính</th>
                        <th>Ngày sinh</th>
                        <th>Email</th>
                        <th>Niên khóa tiếp nhận</th>
                        <th>Khối dự kiến</th>
                        <th className="text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, index) => (
                        <tr key={student.id} style={{ opacity: student.id.toString().startsWith('temp-') ? 0.5 : 1 }}>
                            <td>{student.id.toString().startsWith('temp-') ? <Spinner size="sm" /> : index + 1}</td>
                            <td>
                                <strong>{student.Ho} {student.Ten}</strong>
                                <br />
                                <small className="text-muted">{student.DiaChi}</small>
                            </td>
                            <td>{student.GioiTinh}</td>
                            <td>{new Date(student.NgaySinh).toLocaleDateString('vi-VN')}</td>
                            <td>{student.Email || 'N/A'}</td>
                            <td>{student.TenNienKhoaTiepNhan}</td>
                            <td>{student.TenKhoiDuKien || <span className="text-muted">Chưa có</span>}</td>
                            <td className="text-center">
                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="me-2" 
                                    onClick={() => onEdit('edit', student)} 
                                    title={isReadOnly ? "Không thể sửa ở niên khóa cũ" : (!student.is_deletable ? "Học sinh đã được phân lớp" : "Chỉnh sửa")}
                                    disabled={isReadOnly || !student.is_deletable} 
                                >
                                    <FaEdit />
                                </Button>
                                <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    onClick={() => onDelete(student)} 
                                    title={isReadOnly ? "Không thể xóa ở niên khóa cũ" : (!student.is_deletable ? "Học sinh đã được phân lớp" : "Xóa")}
                                    disabled={isReadOnly || !student.is_deletable} 
                                >
                                    <FaTrashAlt />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default StudentTable;