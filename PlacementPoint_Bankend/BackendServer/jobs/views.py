# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status, permissions
from .models import JobOpening
from .serializers import JobOpeningSerializer, JobOpeningCreateSerializer
from authentications.permissions import IsCoordinator, IsStudent
from authentications.models import Student
from applications.models import Application


class PostJobOpeningAPIView(APIView):
    """
    POST /api/jobs/create/
    Creates job drive + generates dynamic hiring rounds in sequence.
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def post(self, request):
        serializer = JobOpeningCreateSerializer(data=request.data)
        if serializer.is_valid():
            coordinator_profile = getattr(request.user, 'coordinator_profile', None)
            job = serializer.save(created_by=coordinator_profile)
            return Response({
                "message": "Job opening created successfully!",
                "job": JobOpeningSerializer(job).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AllJobOpeningsAPIView(APIView):
    """
    GET /api/jobs/
    Lists all job drives (for Coordinators and Super Admin).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        openings = JobOpening.objects.all().order_by('-created_at')
        serializer = JobOpeningSerializer(openings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


BRANCH_ALIASES = {
    'MCA': ['MCA', 'COMPUTER APPLICATIONS', 'MASTER OF COMPUTER APPLICATIONS'],
    'COMPUTER APPLICATIONS': ['MCA', 'COMPUTER APPLICATIONS', 'MASTER OF COMPUTER APPLICATIONS'],
    'CSE': ['CSE', 'CS', 'COMPUTER SCIENCE', 'COMPUTER SCIENCE AND ENGINEERING'],
    'COMPUTER SCIENCE': ['CSE', 'CS', 'COMPUTER SCIENCE', 'COMPUTER SCIENCE AND ENGINEERING'],
    'IT': ['IT', 'INFORMATION TECHNOLOGY'],
    'INFORMATION TECHNOLOGY': ['IT', 'INFORMATION TECHNOLOGY'],
    'BTECH': ['BTECH', 'B.TECH', 'BACHELOR OF TECHNOLOGY', 'CSE', 'IT', 'ECE', 'EEE', 'CIVIL', 'MECH', 'COMPUTER SCIENCE', 'INFORMATION TECHNOLOGY'],
}


def is_branch_eligible(student_branch, allowed_branches_str):
    if not allowed_branches_str or 'ALL' in [b.strip().upper() for b in (allowed_branches_str or 'ALL').split(',')]:
        return True
    allowed_list = [b.strip().upper() for b in allowed_branches_str.split(',') if b.strip()]
    st_branch = (student_branch or '').strip().upper()
    if st_branch in allowed_list:
        return True
    st_aliases = BRANCH_ALIASES.get(st_branch, [st_branch])
    for allowed in allowed_list:
        allowed_aliases = BRANCH_ALIASES.get(allowed, [allowed])
        if any(a in allowed_aliases for a in st_aliases) or any(a in allowed_list for a in st_aliases):
            return True
    return False


class EligibleJobOpeningsAPIView(APIView):
    """
    GET /api/jobs/eligible/
    Evaluates Student's CGPA, Backlogs, Gap Months, and Branch against all active drives.
    Returns only eligible openings, along with applied status.
    """
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        openings = JobOpening.objects.all().order_by('-created_at')
        applied_job_ids = set(Application.objects.filter(student=student).values_list('job_id', flat=True))

        eligible_list = []

        for job in openings:
            # 1. CGPA Check
            if student.cgpa < job.min_cgpa:
                continue
            # 2. Backlog Threshold Check
            if student.active_backlogs > job.max_backlogs:
                continue
            # 3. Career Gap Check
            if student.career_gap_months > job.max_career_gap_months:
                continue
            # 4. Branch Check (Flexible alias matching)
            if not is_branch_eligible(student.branch, job.allowed_branches):
                continue
            # 5. Passout year check if non-zero
            if job.passout_year and job.passout_year != student.passout_year:
                continue

            job_data = JobOpeningSerializer(job).data
            job_data['has_applied'] = job.job_id in applied_job_ids
            eligible_list.append(job_data)

        return Response(eligible_list, status=status.HTTP_200_OK)


class JobDetailDeleteAPIView(APIView):
    """
    GET /api/jobs/<int:job_id>/
    DELETE /api/jobs/<int:job_id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = JobOpening.objects.get(pk=job_id)
            return Response(JobOpeningSerializer(job).data, status=status.HTTP_200_OK)
        except JobOpening.DoesNotExist:
            return Response({"error": "Job opening not found."}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, job_id):
        if request.user.role not in ['COORDINATOR', 'SUPER_ADMIN']:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        try:
            job = JobOpening.objects.get(pk=job_id)
        except JobOpening.DoesNotExist:
            return Response({"error": "Job opening not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobOpeningCreateSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            updated_job = serializer.save()
            return Response({
                "message": "Job opening updated successfully!",
                "job": JobOpeningSerializer(updated_job).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, job_id):
        if request.user.role not in ['COORDINATOR', 'SUPER_ADMIN']:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        try:
            job = JobOpening.objects.get(pk=job_id)
            job.delete()
            return Response({"message": "Job drive deleted successfully."}, status=status.HTTP_200_OK)
        except JobOpening.DoesNotExist:
            return Response({"error": "Job opening not found."}, status=status.HTTP_404_NOT_FOUND)