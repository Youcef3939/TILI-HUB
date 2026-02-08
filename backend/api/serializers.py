from .models import *
from rest_framework import serializers


class ProjectSerializer(serializers.ModelSerializer):
    """
    Basic Project serializer
    UPDATED: Added priority and responsible fields
    """
    responsible_name = serializers.CharField(source='responsible.name', read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'start_date', 'end_date', 'description', 'budget',
            'status', 'priority', 'responsible', 'responsible_name', 'association',
            'progress_percentage', 'actual_completion_date'
        )


class MemberSerializer(serializers.ModelSerializer):
    association = serializers.PrimaryKeyRelatedField(
        queryset=AssociationAccount.objects.all(),
        required=False
    )
    association_name = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            'id', 'name', 'cin', 'email', 'birth_date', 'address',
            'nationality', 'job', 'joining_date', 'role',
            'association', 'association_name', 'needs_profile_completion'
        ]

    def get_association_name(self, obj):
        return obj.association.name if obj.association else None

    def validate(self, data):
        """Validate that all required fields have proper values"""
        if self.instance:
            name = data.get('name', self.instance.name)
            cin = data.get('cin', self.instance.cin)
            birth_date = data.get('birth_date', self.instance.birth_date)
            address = data.get('address', self.instance.address)
            nationality = data.get('nationality', self.instance.nationality)
            job = data.get('job', self.instance.job)

            # Check if any field is missing or has a default placeholder value
            needs_completion = (
                    not name or
                    not cin or
                    not birth_date or
                    not address or address == "Please update your address" or
                    not nationality or nationality == "Please update your nationality" or
                    not job or job == "Please update your job"
            )

            data['needs_profile_completion'] = needs_completion

            print(f"Member update validation: needs_profile_completion = {needs_completion}")
            if needs_completion:
                print(f"Fields still needed: " +
                      (f"name ('{name}')" if not name else "") +
                      (f"cin ('{cin}')" if not cin else "") +
                      (f"birth_date ('{birth_date}')" if not birth_date else "") +
                      (f"address ('{address}')" if not address or address == "Please update your address" else "") +
                      (
                          f"nationality ('{nationality}')" if not nationality or nationality == "Please update your nationality" else "") +
                      (f"job ('{job}')" if not job or job == "Please update your job" else ""))

        return data


# ============================================================
# NEW SERIALIZERS - Project Management
# ============================================================

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model
    Includes assignee name and project name for easy display
    """
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'project', 'project_name',
            'assigned_to', 'assigned_to_name', 'status', 'priority',
            'start_date', 'due_date', 'estimated_hours', 'actual_hours',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProjectPhaseSerializer(serializers.ModelSerializer):
    """
    Serializer for ProjectPhase model
    Includes validation info
    """
    validated_by_name = serializers.CharField(source='validated_by.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = ProjectPhase
        fields = [
            'id', 'name', 'description', 'order', 'project', 'project_name',
            'status', 'is_validated', 'validated_by', 'validated_by_name',
            'validated_at', 'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'validated_at']


class ProjectReportSerializer(serializers.ModelSerializer):
    """
    Serializer for ProjectReport model
    """
    generated_by_name = serializers.CharField(source='generated_by.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = ProjectReport
        fields = [
            'id', 'project', 'project_name', 'generated_by', 'generated_by_name',
            'meeting_notes', 'summary', 'pdf_file', 'is_final_report', 'generated_at'
        ]
        read_only_fields = ['generated_at']


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Extended Project serializer with related data
    Includes tasks, phases, and reports
    """
    tasks = TaskSerializer(many=True, read_only=True)
    phases = ProjectPhaseSerializer(many=True, read_only=True)
    reports = ProjectReportSerializer(many=True, read_only=True)
    responsible_name = serializers.CharField(source='responsible.name', read_only=True)

    # Count fields for quick stats
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    phase_progress = serializers.SerializerMethodField()

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(status='done').count()

    def get_completion_percentage(self, obj):
        total = obj.tasks.count()
        if total == 0:
            return 0
        completed = obj.tasks.filter(status='done').count()
        return round((completed / total) * 100, 1)

    def get_phase_progress(self, obj):
        phases = obj.phases.all()
        if not phases.exists():
            return 0
        validated = phases.filter(is_validated=True).count()
        total = phases.count()
        return int((validated / total) * 100) if total > 0 else 0

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'start_date', 'end_date', 'description', 'budget',
            'status', 'priority', 'responsible', 'responsible_name', 'association',
            'created_at', 'updated_at', 'tasks', 'phases', 'reports',
            'task_count', 'completed_task_count', 'completion_percentage',
            'progress_percentage', 'phase_progress', 'actual_completion_date'
        ]
        read_only_fields = ['created_at', 'updated_at']