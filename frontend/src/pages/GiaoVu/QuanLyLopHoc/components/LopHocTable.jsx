import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaBook } from 'react-icons/fa';

const LopHocTable = ({ lopHocList, onEdit, onDelete, onManageSubjects }) => {
  return (
    <div className="table-responsive">
      <Table hover className="align-middle">
        <thead className="table-light">
          <tr>
            <th>Tên Lớp</th>
            <th>Khối</th>
            <th>Niên Khóa</th>
            <th>Tổ hợp</th>
            <th>Sĩ Số</th>
            <th>Môn Học</th>
            <th className="text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {lopHocList.map((lop) => (
            <tr key={lop.id} style={{ opacity: lop.id.toString().startsWith('temp-') ? 0.5 : 1 }}>
              <td><strong>{lop.TenLop}</strong></td>
              <td><Badge bg="info">{lop.TenKhoi}</Badge></td>
              <td>{lop.TenNienKhoa}</td>
              <td>{lop.TenToHop || <small className="text-muted">Chưa có</small>}</td>
              <td>{lop.SiSo}</td>
              <td>
                {lop.MonHoc.length > 0 ? (
                  lop.MonHoc.slice(0, 3).map(mh => (
                    <Badge key={mh.id} pill bg="light" text="dark" className="me-1 border">{mh.TenMonHoc}</Badge>
                  ))
                ) : (
                  <small className="text-muted">Chưa có</small>
                )}
                {lop.MonHoc.length > 3 && <Badge pill bg="secondary">...</Badge>}
              </td>
              <td className="text-center">
                <Button variant="outline-success" size="sm" className="me-2" onClick={() => onManageSubjects(lop)} title="Quản lý môn học" disabled={!lop.is_editable}>
                  <FaBook />
                </Button>
                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => onEdit(lop)} title="Sửa lớp học" disabled={!lop.is_editable}>
                  <FaEdit />
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => onDelete(lop)} title="Xóa lớp học" disabled={!lop.is_editable}>
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default LopHocTable;