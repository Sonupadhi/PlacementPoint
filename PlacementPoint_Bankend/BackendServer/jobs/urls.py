from django.urls import path
from .views import (
    PostJobOpeningAPIView,
    AllJobOpeningsAPIView,
    EligibleJobOpeningsAPIView,
    JobDetailDeleteAPIView
)

urlpatterns = [
    path('jobs/', AllJobOpeningsAPIView.as_view(), name='jobs-all'),
    path('jobs/create/', PostJobOpeningAPIView.as_view(), name='jobs-create'),
    path('jobs/eligible/', EligibleJobOpeningsAPIView.as_view(), name='jobs-eligible'),
    path('jobs/<int:job_id>/', JobDetailDeleteAPIView.as_view(), name='jobs-detail-delete'),
]
