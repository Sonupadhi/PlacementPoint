from django.urls import path
from .views import (
    NotificationListCreateAPIView,
    NotificationDeleteAPIView,
    FAQListAPIView,
    StudentQueryListCreateAPIView
)

urlpatterns = [
    path('notifications/', NotificationListCreateAPIView.as_view(), name='notifications-list-create'),
    path('notifications/<int:notice_id>/', NotificationDeleteAPIView.as_view(), name='notifications-delete'),
    path('faqs/', FAQListAPIView.as_view(), name='faqs-list'),
    path('queries/', StudentQueryListCreateAPIView.as_view(), name='queries-list-create'),
]
