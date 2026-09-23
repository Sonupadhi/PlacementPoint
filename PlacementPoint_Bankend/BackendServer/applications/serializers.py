from rest_framework import serializers
from .models import Application
from jobs.serializers import JobOpeningSerializer, JobRoundSerializer
from authentications.serializers import StudentProfileSerializer


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for fetching job application tracking details."""
    job = JobOpeningSerializer(read_only=True)
    current_round = JobRoundSerializer(read_only=True)
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = Application
        fields = [
            'application_id',
            'student',
            'job',
            'current_round',
            'status',
            'applied_at',
            'updated_at'
        ]
        read_only_fields = ['application_id', 'applied_at', 'updated_at']


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer used when Placement Coordinators upload Excel shortlists
    to advance/reject candidates for Round N.
    """
    job_id = serializers.IntegerField(required=True)
    next_stage_order = serializers.IntegerField(required=True)
    excel_file = serializers.FileField(required=True)

    def validate_excel_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls', '.csv')):
            raise serializers.ValidationError("File must be an Excel (.xlsx, .xls) or CSV file.")
        return value