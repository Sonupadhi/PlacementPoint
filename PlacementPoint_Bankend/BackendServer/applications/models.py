from django.db import models

class Application(models.Model):
    application_id = models.AutoField(primary_key=True, db_column='application_id')
    
    student = models.ForeignKey(
        'authentications.Student', 
        on_delete=models.CASCADE, 
        db_column='student_id'
    )
    job = models.ForeignKey(
        'jobs.JobOpening', 
        on_delete=models.CASCADE, 
        db_column='job_id'
    )
    current_round = models.ForeignKey(
        'jobs.JobRound', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column='current_round_id'
    )
    
    status = models.CharField(
        max_length=20, 
        choices=[('IN_PROGRESS', 'In Progress'), ('SELECTED', 'Selected'), ('REJECTED', 'Rejected')],
        default='IN_PROGRESS'
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'applications'
        unique_together = ('student', 'job')