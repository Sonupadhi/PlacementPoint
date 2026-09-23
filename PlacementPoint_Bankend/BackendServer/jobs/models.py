from django.db import models

class JobOpening(models.Model):
    job_id = models.AutoField(primary_key=True, db_column='job_id')
    
    # Points to created_by column referencing coordinators(coordinator_id)
    created_by = models.ForeignKey(
        'authentications.Coordinator', 
        on_delete=models.CASCADE, 
        db_column='created_by',
        null=True,
        blank=True
    )
    company_name = models.CharField(max_length=100)
    role_title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    apply_link = models.CharField(max_length=255)
    min_cgpa = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    max_backlogs = models.IntegerField(default=0)
    max_career_gap_months = models.IntegerField(default=24)
    allowed_branches = models.CharField(max_length=255)
    passout_year = models.IntegerField()
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job_openings'


class JobRound(models.Model):
    round_id = models.AutoField(primary_key=True, db_column='round_id')
    job = models.ForeignKey(
        JobOpening, 
        on_delete=models.CASCADE, 
        db_column='job_id', 
        related_name='rounds'
    )
    round_order = models.IntegerField()
    round_name = models.CharField(max_length=100)

    class Meta:
        db_table = 'job_rounds'
        unique_together = ('job', 'round_order')
        ordering = ['round_order']