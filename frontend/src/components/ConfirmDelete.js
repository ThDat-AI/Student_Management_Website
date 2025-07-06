import Swal from 'sweetalert2'

const confirmDelete = async (message = 'Bạn có chắc muốn xóa?', confirmText = 'Xóa') => {
  const result = await Swal.fire({
    title: message,
    text: 'Hành động này không thể hoàn tác!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: confirmText,
    cancelButtonText: 'Hủy',
    customClass: {
      popup: 'rounded-popup'
    },
    didOpen: () => {
      // Thêm CSS bo góc
      if (!document.getElementById('rounded-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'rounded-popup-styles';
        style.textContent = `
          .rounded-popup {
            border-radius: 16px !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  });

  return result.isConfirmed;
};

export default confirmDelete;