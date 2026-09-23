from django.contrib import admin
from .models import Notification, FAQ, StudentQuery

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('notice_id', 'title', 'target_branch', 'created_at')
    list_filter = ('target_branch', 'created_at')
    search_fields = ('title', 'message')

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('faq_id', 'question', 'category')
    list_filter = ('category',)

@admin.register(StudentQuery)
class StudentQueryAdmin(admin.ModelAdmin):
    list_display = ('query_id', 'student', 'subject', 'status', 'created_at')
    list_filter = ('status', 'created_at')
