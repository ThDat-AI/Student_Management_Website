# your_project/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),

    path("api/auth/", include("authentication.urls")),
    path("api/accounts/", include("accounts.urls")),
    path("api/configurations/", include("configurations.urls")),
    path("api/students/", include("students.urls")),
    path("api/classes/", include("classes.urls")),   # <-- Đảm bảo file này đã tồn tại
    path("api/subjects/", include("subjects.urls")), # <-- Đảm bảo file này đã tồn tại
]