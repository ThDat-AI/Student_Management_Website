
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .models import LopHoc, LopHoc_HocSinh


@receiver(m2m_changed, sender=LopHoc.HocSinh.through)
def update_siso_on_m2m_change(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        # 'instance' ở đây là đối tượng LopHoc
        instance.SiSo = instance.HocSinh.count()
        instance.save(update_fields=['SiSo'])


def update_siso(lop_hoc_id):
    try:
        lop_hoc = LopHoc.objects.get(id=lop_hoc_id)
        lop_hoc.SiSo = lop_hoc.HocSinh.count()
        lop_hoc.save(update_fields=['SiSo'])
    except LopHoc.DoesNotExist:
        
        pass


@receiver(post_save, sender=LopHoc_HocSinh)
def update_siso_on_save(sender, instance, **kwargs):
    """
    Cập nhật sĩ số khi một học sinh được thêm vào lớp qua admin inline.
    'instance' ở đây là đối tượng LopHoc_HocSinh.
    """
    update_siso(instance.IDLopHoc.id)


@receiver(post_delete, sender=LopHoc_HocSinh)
def update_siso_on_delete(sender, instance, **kwargs):
    """
    Cập nhật sĩ số khi một học sinh bị xóa khỏi lớp qua admin inline.
    'instance' ở đây là đối tượng LopHoc_HocSinh.
    """
    update_siso(instance.IDLopHoc.id)