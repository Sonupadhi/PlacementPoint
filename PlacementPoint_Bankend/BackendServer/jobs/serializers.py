# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import JobOpening, JobRound
from authentications.serializers import CoordinatorProfileSerializer


class JobRoundSerializer(serializers.ModelSerializer):
    """Serializer for individual dynamic recruitment rounds."""
    class Meta:
        model = JobRound
        fields = ['round_id', 'round_order', 'round_name']


class JobOpeningSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Job Openings.
    Includes nested dynamic rounds and coordinator details.
    """
    rounds = JobRoundSerializer(many=True, read_only=True)
    created_by_details = CoordinatorProfileSerializer(source='created_by', read_only=True)

    class Meta:
        model = JobOpening
        fields = [
            'job_id',
            'created_by',
            'created_by_details',
            'company_name',
            'role_title',
            'description',
            'apply_link',
            'min_cgpa',
            'max_backlogs',
            'max_career_gap_months',
            'allowed_branches',
            'passout_year',
            'deadline',
            'created_at',
            'rounds'
        ]
        read_only_fields = ['job_id', 'created_by', 'created_at']


class JobOpeningCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used by Coordinators to create job openings along with dynamic stages array.
    Accepts payload: {"stages": ["Applied", "OA", "Technical Round", "HR Round"]}
    """
    stages = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False
    )

    class Meta:
        model = JobOpening
        fields = [
            'job_id',
            'company_name',
            'role_title',
            'description',
            'apply_link',
            'min_cgpa',
            'max_backlogs',
            'max_career_gap_months',
            'allowed_branches',
            'passout_year',
            'deadline',
            'stages'
        ]

    def create(self, validated_data):
        stages_data = validated_data.pop('stages', None)
        if not stages_data:
            stages_data = ['Applied', 'OA', 'Technical Round', 'HR Round']

        job = JobOpening.objects.create(**validated_data)

        # Bulk create dynamic hiring rounds sequentially
        round_objects = [
            JobRound(
                job=job,
                round_order=index + 1,
                round_name=stage_name
            )
            for index, stage_name in enumerate(stages_data)
        ]
        JobRound.objects.bulk_create(round_objects)
        return job

    def update(self, instance, validated_data):
        stages_data = validated_data.pop('stages', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if stages_data is not None and len(stages_data) > 0:
            instance.rounds.all().delete()
            round_objects = [
                JobRound(
                    job=instance,
                    round_order=index + 1,
                    round_name=stage_name
                )
                for index, stage_name in enumerate(stages_data)
            ]
            JobRound.objects.bulk_create(round_objects)

        return instance