from django.db import models

class Notification(models.Model):
    notice_id = models.AutoField(primary_key=True, db_column='notice_id')
    created_by = models.ForeignKey(
        'authentications.Coordinator', 
        on_delete=models.CASCADE, 
        db_column='created_by'
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    target_branch = models.CharField(max_length=50, default='ALL')
    target_job = models.ForeignKey(
        'jobs.JobOpening', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column='target_job_id'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']


class FAQ(models.Model):
    faq_id = models.AutoField(primary_key=True)
    question = models.CharField(max_length=255)
    answer = models.TextField()
    category = models.CharField(max_length=50, default='General')

    class Meta:
        db_table = 'faqs'


class StudentQuery(models.Model):
    query_id = models.AutoField(primary_key=True)
    student = models.ForeignKey('authentications.Student', on_delete=models.CASCADE)
    subject = models.CharField(max_length=150)
    message = models.TextField()
    response = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='OPEN') # OPEN, RESOLVED
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_queries'
        ordering = ['-created_at']
