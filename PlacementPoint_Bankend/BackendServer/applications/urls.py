from django.urls import path
from .views import (
    ApplyJobAPIView,
    StudentApplicationsAPIView,
    JobApplicationsAPIView,
    BulkShortlistUpdateAPIView,
    UpdateJobStageAPIView
)

urlpatterns = [
    path('applications/apply/', ApplyJobAPIView.as_view(), name='applications-apply'),
    path('applications/my-applications/', StudentApplicationsAPIView.as_view(), name='applications-my-applications'),
    path('applications/job-applications/<int:job_id>/', JobApplicationsAPIView.as_view(), name='applications-job-applications'),
    path('applications/update-shortlist/', BulkShortlistUpdateAPIView.as_view(), name='applications-update-shortlist'),
    path('applications/update-stage/', UpdateJobStageAPIView.as_view(), name='applications-update-stage'),
]
