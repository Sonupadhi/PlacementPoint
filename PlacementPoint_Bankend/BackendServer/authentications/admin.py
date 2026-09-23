from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Student, Coordinator

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_first_login', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Profile Info', {'fields': ('role', 'is_first_login')}),
    )

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('registration_id', 'name', 'branch', 'cgpa', 'passout_year', 'active_backlogs', 'career_gap_months')
    search_fields = ('registration_id', 'name', 'branch')
    list_filter = ('branch', 'passout_year')

@admin.register(Coordinator)
class CoordinatorAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'name', 'department')
    search_fields = ('employee_id', 'name', 'department')
