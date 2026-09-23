from rest_framework import serializers
from .models import Notification, FAQ, StudentQuery
from authentications.serializers import CoordinatorProfileSerializer, StudentProfileSerializer


class NotificationSerializer(serializers.ModelSerializer):
    created_by_details = CoordinatorProfileSerializer(source='created_by', read_only=True)
    target_job_title = serializers.CharField(source='target_job.company_name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'notice_id',
            'created_by',
            'created_by_details',
            'title',
            'message',
            'target_branch',
            'target_job',
            'target_job_title',
            'created_at'
        ]
        read_only_fields = ['notice_id', 'created_by', 'created_at']


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['faq_id', 'question', 'answer', 'category']


class StudentQuerySerializer(serializers.ModelSerializer):
    student_details = StudentProfileSerializer(source='student', read_only=True)

    class Meta:
        model = StudentQuery
        fields = [
            'query_id',
            'student',
            'student_details',
            'subject',
            'message',
            'response',
            'status',
            'created_at'
        ]
        read_only_fields = ['query_id', 'student', 'created_at']
