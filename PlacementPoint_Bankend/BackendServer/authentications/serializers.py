from rest_framework import serializers
from .models import User, Student, Coordinator


class UserSerializer(serializers.ModelSerializer):
    """Base user serializer for authentication and user details."""
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'role', 'is_first_login', 'is_active', 'date_joined']
        read_only_fields = ['user_id', 'date_joined']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for fetching and updating Student profiles."""
    email = serializers.EmailField(source='student.email', read_only=True)
    username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Student
        fields = [
            'student_id', 
            'username', 
            'email', 
            'registration_id', 
            'name', 
            'branch', 
            'cgpa', 
            'passout_year', 
            'active_backlogs', 
            'career_gap_months'
        ]
        read_only_fields = ['student_id']


class CoordinatorProfileSerializer(serializers.ModelSerializer):
    """Serializer for Coordinator profiles."""
    email = serializers.EmailField(source='coordinator.email', read_only=True)
    username = serializers.CharField(source='coordinator.username', read_only=True)

    class Meta:
        model = Coordinator
        fields = ['coordinator_id', 'username', 'employee_id', 'name', 'department', 'email']
        read_only_fields = ['coordinator_id']


class ChangePasswordSerializer(serializers.Serializer):
    """Validation serializer for password reset on first login."""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)


class CoordinatorCreateSerializer(serializers.Serializer):
    """Serializer for Super Admin creating a Placement Coordinator account."""
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(max_length=100, default='Coord@123')
    employee_id = serializers.CharField(max_length=50)
    name = serializers.CharField(max_length=100)
    department = serializers.CharField(max_length=50)


class StudentCreateSerializer(serializers.Serializer):
    """Serializer for Super Admin adding a Student manually."""
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(max_length=100, default='Student@123')
    registration_id = serializers.CharField(max_length=50)
    name = serializers.CharField(max_length=100)
    branch = serializers.CharField(max_length=50)
    cgpa = serializers.DecimalField(max_digits=4, decimal_places=2)
    passout_year = serializers.IntegerField()
    active_backlogs = serializers.IntegerField(default=0)
    career_gap_months = serializers.IntegerField(default=0)