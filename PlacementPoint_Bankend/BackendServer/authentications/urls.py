from django.urls import path
from .views import (
    LoginAPIView,
    MeAPIView,
    ChangePasswordAPIView,
    CoordinatorListCreateAPIView,
    CoordinatorDeleteAPIView,
    StudentListCreateAPIView,
    StudentDeleteAPIView,
    StudentBulkDeleteAPIView,
    StudentFilterDeleteAPIView,
    StudentBulkImportAPIView,
    SuperAdminAnalyticsAPIView
)

urlpatterns = [
    # Auth endpoints
    path('auth/login/', LoginAPIView.as_view(), name='auth-login'),
    path('auth/me/', MeAPIView.as_view(), name='auth-me'),
    path('auth/change-password/', ChangePasswordAPIView.as_view(), name='auth-change-password'),

    # Super Admin & Coordinator endpoints
    path('admin/coordinators/', CoordinatorListCreateAPIView.as_view(), name='admin-coordinators'),
    path('admin/coordinators/<int:coordinator_id>/', CoordinatorDeleteAPIView.as_view(), name='admin-coordinator-delete'),
    path('admin/students/bulk-delete/', StudentBulkDeleteAPIView.as_view(), name='admin-students-bulk-delete'),
    path('admin/students/filter-delete/', StudentFilterDeleteAPIView.as_view(), name='admin-students-filter-delete'),
    path('admin/students/', StudentListCreateAPIView.as_view(), name='admin-students'),
    path('admin/students/<int:student_id>/', StudentDeleteAPIView.as_view(), name='admin-student-delete'),
    path('admin/bulk-upload-students/', StudentBulkImportAPIView.as_view(), name='admin-bulk-upload-students'),
    path('admin/analytics/', SuperAdminAnalyticsAPIView.as_view(), name='admin-analytics'),
]
