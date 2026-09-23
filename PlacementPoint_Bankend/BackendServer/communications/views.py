from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import Notification, FAQ, StudentQuery
from .serializers import NotificationSerializer, FAQSerializer, StudentQuerySerializer
from authentications.permissions import IsCoordinator, IsStudent


class NotificationListCreateAPIView(APIView):
    """
    GET /api/notifications/ - View notices filtered by student branch or ALL
    POST /api/notifications/ - Publish notice (Coordinators & Super Admin)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        notices = Notification.objects.all()

        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            student_branch = user.student_profile.branch.strip().upper()
            notices = notices.filter(target_branch__in=['ALL', 'all', student_branch])

        serializer = NotificationSerializer(notices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role not in ['COORDINATOR', 'SUPER_ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            coordinator_profile = getattr(request.user, 'coordinator_profile', None)
            notice = serializer.save(created_by=coordinator_profile)
            return Response(NotificationSerializer(notice).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationDeleteAPIView(APIView):
    """
    DELETE /api/notifications/<int:notice_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsCoordinator]

    def delete(self, request, notice_id):
        try:
            notice = Notification.objects.get(pk=notice_id)
            notice.delete()
            return Response({'message': 'Notice deleted.'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({'error': 'Notice not found.'}, status=status.HTTP_404_NOT_FOUND)


class FAQListAPIView(APIView):
    """
    GET /api/faqs/ - List system FAQs
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        faqs = FAQ.objects.all()
        serializer = FAQSerializer(faqs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentQueryListCreateAPIView(APIView):
    """
    GET /api/queries/ - Student views their queries (or coordinator views all queries)
    POST /api/queries/ - Student submits a new query
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            queries = StudentQuery.objects.filter(student=user.student_profile)
        else:
            queries = StudentQuery.objects.all()

        serializer = StudentQuerySerializer(queries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != 'STUDENT':
            return Response({'error': 'Only students can submit queries.'}, status=status.HTTP_403_FORBIDDEN)

        student_profile = request.user.student_profile
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not subject or not message:
            return Response({'error': 'Subject and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        query = StudentQuery.objects.create(
            student=student_profile,
            subject=subject,
            message=message
        )
        return Response(StudentQuerySerializer(query).data, status=status.HTTP_201_CREATED)
