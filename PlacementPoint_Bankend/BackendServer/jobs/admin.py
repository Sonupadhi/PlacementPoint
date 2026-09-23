from django.contrib import admin
from .models import JobOpening, JobRound

class JobRoundInline(admin.TabularInline):
    model = JobRound
    extra = 1

@admin.register(JobOpening)
class JobOpeningAdmin(admin.ModelAdmin):
    list_display = ('job_id', 'company_name', 'role_title', 'min_cgpa', 'allowed_branches', 'deadline', 'created_at')
    list_filter = ('passout_year', 'created_at')
    search_fields = ('company_name', 'role_title', 'allowed_branches')
    inlines = [JobRoundInline]

@admin.register(JobRound)
class JobRoundAdmin(admin.ModelAdmin):
    list_display = ('round_id', 'job', 'round_order', 'round_name')
    list_filter = ('round_name',)
