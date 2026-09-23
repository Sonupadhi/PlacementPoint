from django.contrib import admin
from .models import Application

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('application_id', 'student', 'job', 'current_round', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('student__name', 'student__registration_id', 'job__company_name')
