from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Maps user_id as the primary key column
    user_id = models.AutoField(primary_key=True, db_column='user_id')
    
    # Custom fields in your MySQL table
    role = models.CharField(
        max_length=20, 
        choices=[('STUDENT', 'Student'), ('COORDINATOR', 'Coordinator'), ('SUPER_ADMIN', 'Super Admin')]
    )
    is_first_login = models.BooleanField(default=True)

    class Meta:
        db_table = 'users'


class Student(models.Model):
    # 1-to-1 foreign key referencing users(user_id)
    student = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        primary_key=True, 
        db_column='student_id',
        related_name='student_profile'
    )
    registration_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    branch = models.CharField(max_length=50)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2)
    passout_year = models.IntegerField()
    active_backlogs = models.IntegerField(default=0)
    career_gap_months = models.IntegerField(default=0)

    class Meta:
        db_table = 'students'


class Coordinator(models.Model):
    # 1-to-1 foreign key referencing users(user_id)
    coordinator = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        primary_key=True, 
        db_column='coordinator_id',
        related_name='coordinator_profile'
    )
    employee_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=50)

    class Meta:
        db_table = 'coordinators'