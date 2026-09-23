import pandas as pd
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status, permissions
from django.db import transaction

from .models import Application
from .serializers import ApplicationSerializer, ApplicationStatusUpdateSerializer
from jobs.models import JobOpening, JobRound
from jobs.views import is_branch_eligible
from authentications.models import Student
from authentications.permissions import IsStudent, IsCoordinator


class ApplyJobAPIView(APIView):
    """
    POST /api/applications/apply/
    Student applies to an eligible job drive.
    """
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            job = JobOpening.objects.get(pk=job_id)
        except JobOpening.DoesNotExist:
            return Response({'error': 'Job opening not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check existing application
        if Application.objects.filter(student=student, job=job).exists():
            return Response({'error': 'You have already applied to this job drive.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check eligibility
        if student.cgpa < job.min_cgpa:
            return Response({'error': 'You do not meet the minimum CGPA requirement.'}, status=status.HTTP_400_BAD_REQUEST)
        if student.active_backlogs > job.max_backlogs:
            return Response({'error': 'Active backlogs exceed maximum allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        if student.career_gap_months > job.max_career_gap_months:
            return Response({'error': 'Career gap exceeds maximum allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        if not is_branch_eligible(student.branch, job.allowed_branches):
            return Response({'error': 'Your branch is not eligible for this job drive.'}, status=status.HTTP_400_BAD_REQUEST)

        # Assign first round
        first_round = JobRound.objects.filter(job=job).order_by('round_order').first()

        application = Application.objects.create(
            student=student,
            job=job,
            current_round=first_round,
            status='IN_PROGRESS'
        )

        return Response({
            'message': 'Successfully applied to job drive!',
            'application': ApplicationSerializer(application).data
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """
        DELETE /api/applications/apply/
        Student withdraws an application for a specific job drive.
        """
        job_id = request.data.get('job_id') or request.query_params.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            application = Application.objects.get(student=student, job_id=job_id)
            if application.status != 'IN_PROGRESS':
                return Response({'error': 'Cannot withdraw application once status is finalized.'}, status=status.HTTP_400_BAD_REQUEST)
            application.delete()
            return Response({'message': 'Application withdrawn successfully.'}, status=status.HTTP_200_OK)
        except Application.DoesNotExist:
            return Response({'error': 'Application record not found.'}, status=status.HTTP_404_NOT_FOUND)


class StudentApplicationsAPIView(APIView):
    """
    GET /api/applications/my-applications/
    Returns list of all applications for current student with round details.
    """
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        applications = Application.objects.filter(student=student).select_related('job', 'current_round').order_by('-applied_at')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class JobApplicationsAPIView(APIView):
    """
    GET /api/applications/job-applications/<int:job_id>/
    Returns list of applicant records for a specific job drive (Coordinator view).
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def get(self, request, job_id):
        try:
            job = JobOpening.objects.get(pk=job_id)
        except JobOpening.DoesNotExist:
            return Response({'error': 'Job drive not found.'}, status=status.HTTP_404_NOT_FOUND)

        applications = Application.objects.filter(job=job).select_related('student', 'current_round').order_by('-applied_at')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BulkShortlistUpdateAPIView(APIView):
    """
    POST /api/applications/update-shortlist/
    Coordinator uploads Excel/CSV file with shortlisted student registration IDs
    to advance candidates to the target round or mark them selected/rejected.
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        job_id = request.data.get('job_id')
        target_round_order = request.data.get('next_stage_order')
        excel_file = request.FILES.get('excel_file')
        mark_rejected = request.data.get('mark_rejected', 'true').lower() == 'true'

        if not job_id or not target_round_order or not excel_file:
            return Response({'error': 'job_id, next_stage_order, and excel_file are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job_id = int(job_id)
            target_round_order = int(target_round_order)
            job = JobOpening.objects.get(pk=job_id)
        except (ValueError, JobOpening.DoesNotExist):
            return Response({'error': 'Invalid job_id or target_round_order.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get total rounds for this job
        rounds = list(JobRound.objects.filter(job=job).order_by('round_order'))
        max_round_order = max([r.round_order for r in rounds]) if rounds else 1

        # Check target round
        target_round = JobRound.objects.filter(job=job, round_order=target_round_order).first()
        is_final_selection = target_round_order > max_round_order

        # Parse Excel/CSV
        try:
            if excel_file.name.endswith('.csv'):
                df = pd.read_csv(excel_file)
            else:
                df = pd.read_excel(excel_file)

            # Flexible column lookup for registration ID
            reg_col = None
            for col in df.columns:
                col_clean = str(col).lower()
                if 'reg' in col_clean or 'id' in col_clean or 'student' in col_clean or 'roll' in col_clean:
                    reg_col = col
                    break
            if not reg_col:
                reg_col = df.columns[0]  # Fallback to first column

            shortlisted_reg_ids = set()
            for val in df[reg_col].dropna():
                val_str = str(val).strip()
                if val_str.endswith('.0'):
                    val_str = val_str[:-2]
                shortlisted_reg_ids.add(val_str.upper())

        except Exception as e:
            return Response({'error': f'Failed to process Excel file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Perform Bulk Updates
        advanced_count = 0
        selected_count = 0
        rejected_count = 0

        with transaction.atomic():
            applications = Application.objects.filter(job=job, status='IN_PROGRESS')

            for app in applications:
                student_reg = app.student.registration_id.strip().upper()
                student_pk = str(app.student.student_id).strip().upper()

                if student_reg in shortlisted_reg_ids or student_pk in shortlisted_reg_ids:
                    if is_final_selection:
                        app.status = 'SELECTED'
                        selected_count += 1
                    else:
                        app.current_round = target_round
                        app.status = 'IN_PROGRESS'
                        advanced_count += 1
                    app.save()
                elif mark_rejected:
                    # Candidate was not shortlisted for this round
                    app.status = 'REJECTED'
                    app.save()
                    rejected_count += 1

        return Response({
            'message': 'Candidate shortlist processed successfully!',
            'advanced_count': advanced_count,
            'selected_count': selected_count,
            'rejected_count': rejected_count
        }, status=status.HTTP_200_OK)


class UpdateJobStageAPIView(APIView):
    """
    POST /api/applications/update-stage/
    Coordinator directly updates the active hiring stage for a job drive.
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        job_id = request.data.get('job_id')
        target_round_order = request.data.get('next_stage_order')

        if not job_id or target_round_order is None:
            return Response({'error': 'job_id and next_stage_order are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job_id = int(job_id)
            target_round_order = int(target_round_order)
            job = JobOpening.objects.get(pk=job_id)
        except (ValueError, JobOpening.DoesNotExist):
            return Response({'error': 'Invalid job_id or target_round_order.'}, status=status.HTTP_400_BAD_REQUEST)

        rounds = list(JobRound.objects.filter(job=job).order_by('round_order'))
        max_round_order = max([r.round_order for r in rounds]) if rounds else 1

        target_round = JobRound.objects.filter(job=job, round_order=target_round_order).first()
        is_final_selection = target_round_order > max_round_order

        updated_count = 0
        with transaction.atomic():
            applications = Application.objects.filter(job=job, status='IN_PROGRESS')
            for app in applications:
                if is_final_selection:
                    app.status = 'SELECTED'
                else:
                    app.current_round = target_round
                    app.status = 'IN_PROGRESS'
                app.save()
                updated_count += 1

        stage_title = "Final Selection / Hired" if is_final_selection else (target_round.round_name if target_round else f"Stage {target_round_order}")
        return Response({
            'message': f'Updated hiring stage to "{stage_title}" for {updated_count} candidate(s)!',
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)

