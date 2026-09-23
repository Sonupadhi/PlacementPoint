import pandas as pd
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status, permissions
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction

from .models import User, Student, Coordinator
from .serializers import (
    UserSerializer, 
    StudentProfileSerializer, 
    CoordinatorProfileSerializer, 
    ChangePasswordSerializer,
    CoordinatorCreateSerializer,
    StudentCreateSerializer
)
from .permissions import IsSuperAdmin, IsCoordinator, IsStudent
from jobs.models import JobOpening, JobRound
from applications.models import Application


class LoginAPIView(APIView):
    """
    POST /api/auth/login/
    Custom login returning JWT tokens, user info, and role profile.
    Supports login via Username, Email, Employee ID, or Registration ID.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        input_identifier = str(
            request.data.get('username') or 
            request.data.get('identifier') or 
            request.data.get('email') or ''
        ).strip()
        password = request.data.get('password')

        if not input_identifier or not password:
            return Response({'error': 'Username/ID and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Flexible lookup by username, email, employee_id, or registration_id
        target_user = User.objects.filter(username__iexact=input_identifier).first() or User.objects.filter(email__iexact=input_identifier).first()

        if not target_user:
            coord = Coordinator.objects.filter(employee_id__iexact=input_identifier).first()
            if coord:
                target_user = coord.coordinator

        if not target_user:
            stud = Student.objects.filter(registration_id__iexact=input_identifier).first()
            if stud:
                target_user = stud.student

        if not target_user:
            return Response({'error': 'Invalid credentials. User account not found.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=target_user.username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials. Incorrect password.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)

        profile_data = None
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            profile_data = StudentProfileSerializer(user.student_profile).data
        elif user.role == 'COORDINATOR' and hasattr(user, 'coordinator_profile'):
            profile_data = CoordinatorProfileSerializer(user.coordinator_profile).data

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'user_id': user.user_id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_first_login': user.is_first_login
            },
            'profile': profile_data
        }, status=status.HTTP_200_OK)


class MeAPIView(APIView):
    """
    GET /api/auth/me/
    Returns current authenticated user details.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile_data = None
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            profile_data = StudentProfileSerializer(user.student_profile).data
        elif user.role == 'COORDINATOR' and hasattr(user, 'coordinator_profile'):
            profile_data = CoordinatorProfileSerializer(user.coordinator_profile).data

        return Response({
            'user': UserSerializer(user).data,
            'profile': profile_data
        }, status=status.HTTP_200_OK)


class ChangePasswordAPIView(APIView):
    """
    POST /api/auth/change-password/
    Mandatory first-login password change endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.is_first_login = False
        user.save()

        return Response({'message': 'Password changed successfully!'}, status=status.HTTP_200_OK)


class CoordinatorListCreateAPIView(APIView):
    """
    GET /api/admin/coordinators/ - List all coordinators
    POST /api/admin/coordinators/ - Create new coordinator
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        coordinators = Coordinator.objects.all()
        serializer = CoordinatorProfileSerializer(coordinators, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CoordinatorCreateSerializer(data=request.data)
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_err = serializer.errors[first_field][0]
            return Response({
                'error': f'{first_field.replace("_", " ").capitalize()}: {first_err}',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=data['email']).exists():
            return Response({'error': 'Email address already registered.'}, status=status.HTTP_400_BAD_REQUEST)
        if Coordinator.objects.filter(employee_id=data['employee_id']).exists():
            return Response({'error': 'Employee ID already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                role='COORDINATOR',
                is_first_login=True
            )
            coordinator = Coordinator.objects.create(
                coordinator=user,
                employee_id=data['employee_id'],
                name=data['name'],
                department=data['department']
            )

        return Response({
            'message': 'Coordinator account created successfully!',
            'coordinator': CoordinatorProfileSerializer(coordinator).data
        }, status=status.HTTP_201_CREATED)


class CoordinatorDeleteAPIView(APIView):
    """
    DELETE /api/admin/coordinators/<int:coordinator_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def delete(self, request, coordinator_id):
        try:
            coordinator = Coordinator.objects.get(pk=coordinator_id)
            user = coordinator.coordinator
            user.delete()
            return Response({'message': 'Coordinator deleted successfully.'}, status=status.HTTP_200_OK)
        except Coordinator.DoesNotExist:
            return Response({'error': 'Coordinator not found.'}, status=status.HTTP_404_NOT_FOUND)


class StudentListCreateAPIView(APIView):
    """
    GET /api/admin/students/ - List all students
    POST /api/admin/students/ - Create student manually
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def get(self, request):
        students = Student.objects.all()
        serializer = StudentProfileSerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StudentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_err = serializer.errors[first_field][0]
            return Response({
                'error': f'{first_field.replace("_", " ").capitalize()}: {first_err}',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=data['email']).exists():
            return Response({'error': 'Email address already registered.'}, status=status.HTTP_400_BAD_REQUEST)
        if Student.objects.filter(registration_id=data['registration_id']).exists():
            return Response({'error': 'Registration ID already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                role='STUDENT',
                is_first_login=True
            )
            student = Student.objects.create(
                student=user,
                registration_id=data['registration_id'],
                name=data['name'],
                branch=data['branch'],
                cgpa=data['cgpa'],
                passout_year=data['passout_year'],
                active_backlogs=data['active_backlogs'],
                career_gap_months=data['career_gap_months']
            )

        return Response({
            'message': 'Student created successfully!',
            'student': StudentProfileSerializer(student).data
        }, status=status.HTTP_201_CREATED)


class StudentDeleteAPIView(APIView):
    """
    DELETE /api/admin/students/<int:student_id>/
    Deletes a single student record by student_id.
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def delete(self, request, student_id):
        try:
            student = Student.objects.get(pk=student_id)
            user = student.student
            user.delete()
            return Response({'message': 'Student record deleted successfully.'}, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)


class StudentBulkDeleteAPIView(APIView):
    """
    POST /api/admin/students/bulk-delete/
    DELETE /api/admin/students/bulk-delete/
    Coordinators and Super Admin can delete multiple student records at once.
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        student_ids = request.data.get('student_ids', [])
        if not student_ids or not isinstance(student_ids, list):
            return Response({'error': 'student_ids list is required.'}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(student_profile__student_id__in=student_ids)
        deleted_count, _ = users.delete()
        return Response({
            'message': f'Successfully deleted {deleted_count} student record(s).',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        student_ids = request.data.get('student_ids', [])
        if not student_ids or not isinstance(student_ids, list):
            return Response({'error': 'student_ids list is required.'}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(student_profile__student_id__in=student_ids)
        deleted_count, _ = users.delete()
        return Response({
            'message': f'Successfully deleted {deleted_count} student record(s).',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)


class StudentFilterDeleteAPIView(APIView):
    """
    POST /api/admin/students/filter-delete/
    Deletes students matching specified filters (branch, passout_year, min_backlogs, max_cgpa).
    Supports preview=True query/payload to calculate matching record counts without deleting.
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        branch = request.data.get('branch')
        passout_year = request.data.get('passout_year')
        min_backlogs = request.data.get('min_backlogs')
        max_cgpa = request.data.get('max_cgpa')
        preview_only = request.data.get('preview', False)

        students = Student.objects.all()

        if branch and str(branch).strip().upper() not in ['ALL', '']:
            students = students.filter(branch__iexact=str(branch).strip())

        if passout_year and str(passout_year).strip().upper() not in ['ALL', '']:
            try:
                students = students.filter(passout_year=int(passout_year))
            except (ValueError, TypeError):
                pass

        if min_backlogs is not None and str(min_backlogs).strip().upper() not in ['ALL', '']:
            try:
                students = students.filter(active_backlogs__gte=int(min_backlogs))
            except (ValueError, TypeError):
                pass

        if max_cgpa is not None and str(max_cgpa).strip().upper() not in ['ALL', '']:
            try:
                students = students.filter(cgpa__lte=float(max_cgpa))
            except (ValueError, TypeError):
                pass

        matching_count = students.count()

        if preview_only:
            return Response({
                'matching_count': matching_count
            }, status=status.HTTP_200_OK)

        user_ids = list(students.values_list('student_id', flat=True))
        if not user_ids:
            return Response({
                'message': 'No student records matched the specified criteria.',
                'deleted_count': 0
            }, status=status.HTTP_200_OK)

        users = User.objects.filter(user_id__in=user_ids)
        deleted_count, _ = users.delete()

        return Response({
            'message': f'Successfully deleted {deleted_count} student record(s) matching filter criteria.',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)


class StudentBulkImportAPIView(APIView):
    """
    POST /api/admin/bulk-upload-students/
    Super Admin & Coordinators bulk import student records via Excel/CSV upload.
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        excel_file = request.FILES.get('excel_file') or request.FILES.get('file') or request.FILES.get('csv_file')
        if not excel_file:
            return Response({'error': 'No file uploaded. Please attach an Excel (.xlsx) or CSV (.csv) file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if excel_file.name.endswith('.csv'):
                df = pd.read_csv(excel_file)
            else:
                df = pd.read_excel(excel_file)

            # Normalize column names: strip whitespace, lower case, replace spaces, dots, and dashes with underscores
            renamed_cols = {}
            for col in df.columns:
                clean = str(col).strip().lower().replace(' ', '_').replace('-', '_').replace('.', '_')
                renamed_cols[col] = clean
            df.rename(columns=renamed_cols, inplace=True)

            def get_field_val(row, candidate_keys, default=None):
                for key in candidate_keys:
                    if key in row and pd.notnull(row[key]):
                        val_str = str(row[key]).strip()
                        if val_str and val_str.lower() != 'nan':
                            return row[key]
                return default

            # Extended column aliases mapping
            reg_keys = ['registration_id', 'reg_id', 'regid', 'reg_no', 'regno', 'registration', 'register_id', 'roll_no', 'rollno', 'roll_number', 'registration_no', 'registration_number', 'student_id', 'usn']
            name_keys = ['name', 'student_name', 'full_name', 'student']
            email_keys = ['email', 'email_id', 'email_address', 'mail']
            branch_keys = ['branch', 'department', 'dept', 'stream', 'course']
            cgpa_keys = ['cgpa', 'gpa', 'marks', 'percentage']
            passout_keys = ['passout_year', 'passing_year', 'pass_out_year', 'batch', 'year']
            backlog_keys = ['active_backlogs', 'active_backlog', 'backlog', 'backlogs', 'back_log', 'back_logs', 'no_of_backlogs', 'num_backlogs', 'backlog_count', 'live_backlogs']
            gap_keys = ['career_gap_months', 'career_gap', 'gap', 'gap_months', 'career_gap_in_months']

            # Required column presence check
            for field_label, keys in [
                ('Registration ID', reg_keys),
                ('Name', name_keys),
                ('Email', email_keys),
            ]:
                if not any(k in df.columns for k in keys):
                    return Response({
                        'error': f"Missing required column in file for '{field_label}'. Accepted header names: {', '.join(keys)}"
                    }, status=status.HTTP_400_BAD_REQUEST)

            from django.contrib.auth.hashers import make_password
            default_hashed_password = make_password('Student@123')

            created_count = 0
            updated_count = 0
            skipped_count = 0

            for _, row in df.iterrows():
                reg_id_raw = get_field_val(row, reg_keys)
                name_raw = get_field_val(row, name_keys)
                email_raw = get_field_val(row, email_keys)

                if not all([reg_id_raw, name_raw, email_raw]):
                    skipped_count += 1
                    continue

                if isinstance(reg_id_raw, float) and reg_id_raw.is_integer():
                    reg_id = str(int(reg_id_raw))
                else:
                    reg_id_str = str(reg_id_raw).strip()
                    if reg_id_str.endswith('.0'):
                        reg_id_str = reg_id_str[:-2]
                    reg_id = reg_id_str

                name = str(name_raw).strip()
                email = str(email_raw).strip()

                branch_raw = get_field_val(row, branch_keys, default='General')
                branch = str(branch_raw).strip() if branch_raw else 'General'

                cgpa_raw = get_field_val(row, cgpa_keys, default=0.0)
                try:
                    cgpa = float(cgpa_raw)
                except (ValueError, TypeError):
                    cgpa = 0.0

                passout_raw = get_field_val(row, passout_keys, default=2027)
                try:
                    passout_year = int(float(passout_raw))
                except (ValueError, TypeError):
                    passout_year = 2027

                backlog_raw = get_field_val(row, backlog_keys, default=0)
                try:
                    active_backlogs = int(float(backlog_raw))
                except (ValueError, TypeError):
                    active_backlogs = 0

                gap_raw = get_field_val(row, gap_keys, default=0)
                try:
                    career_gap_months = int(float(gap_raw))
                except (ValueError, TypeError):
                    career_gap_months = 0

                with transaction.atomic():
                    student_obj = Student.objects.filter(registration_id=reg_id).first()
                    user_obj = User.objects.filter(username=reg_id).first()

                    if student_obj:
                        student_obj.name = name
                        student_obj.branch = branch
                        student_obj.cgpa = cgpa
                        student_obj.passout_year = passout_year
                        student_obj.active_backlogs = active_backlogs
                        student_obj.career_gap_months = career_gap_months
                        student_obj.save()

                        if student_obj.student:
                            student_obj.student.email = email
                            student_obj.student.save()

                        updated_count += 1

                    elif user_obj and hasattr(user_obj, 'student_profile'):
                        sp = user_obj.student_profile
                        sp.registration_id = reg_id
                        sp.name = name
                        sp.branch = branch
                        sp.cgpa = cgpa
                        sp.passout_year = passout_year
                        sp.active_backlogs = active_backlogs
                        sp.career_gap_months = career_gap_months
                        sp.save()

                        user_obj.email = email
                        user_obj.save()

                        updated_count += 1

                    else:
                        if User.objects.filter(email=email).exclude(username=reg_id).exists():
                            skipped_count += 1
                            continue

                        user = User(
                            username=reg_id,
                            email=email,
                            password=default_hashed_password,
                            role='STUDENT',
                            is_first_login=True
                        )
                        user.save()

                        Student.objects.create(
                            student=user,
                            registration_id=reg_id,
                            name=name,
                            branch=branch,
                            cgpa=cgpa,
                            passout_year=passout_year,
                            active_backlogs=active_backlogs,
                            career_gap_months=career_gap_months
                        )
                        created_count += 1

            return Response({
                'message': f'Bulk import completed! {created_count} new student(s) created, {updated_count} existing record(s) updated, {skipped_count} skipped.',
                'created': created_count,
                'updated': updated_count,
                'skipped': skipped_count
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f'Failed to process file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)



class SuperAdminAnalyticsAPIView(APIView):
    """
    GET /api/admin/analytics/
    Returns system placement metrics, branch statistics, and drive counts.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        total_students = Student.objects.count()
        total_coordinators = Coordinator.objects.count()
        total_jobs = JobOpening.objects.count()
        total_applications = Application.objects.count()

        selected_count = Application.objects.filter(status='SELECTED').count()
        in_progress_count = Application.objects.filter(status='IN_PROGRESS').count()
        rejected_count = Application.objects.filter(status='REJECTED').count()

        # Branch distribution
        branches = Student.objects.values('branch').distinct()
        branch_stats = []
        for b in branches:
            branch_name = b['branch']
            stud_cnt = Student.objects.filter(branch=branch_name).count()
            selected_cnt = Application.objects.filter(student__branch=branch_name, status='SELECTED').count()
            branch_stats.append({
                'branch': branch_name,
                'students': stud_cnt,
                'selected': selected_cnt
            })

        return Response({
            'overview': {
                'total_students': total_students,
                'total_coordinators': total_coordinators,
                'total_jobs': total_jobs,
                'total_applications': total_applications,
                'selected_students': selected_count,
                'in_progress_applications': in_progress_count,
                'rejected_applications': rejected_count,
            },
            'branch_stats': branch_stats
        }, status=status.HTTP_200_OK)
