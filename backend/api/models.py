from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.db.models import Q
from users.models import AssociationAccount


class Project(models.Model):
    # ✅ ADDED: Priority choices for project importance
    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]

    name = models.CharField(unique=True, max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(max_length=500)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=100)

    # ✅ ADDED: Priority field - to classify project importance
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name="Priorité"
    )

    # ✅ ADDED: Responsible field - links to Member who manages this project
    responsible = models.ForeignKey(
        'Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_projects',
        verbose_name="Responsable du projet"
    )

    association = models.ForeignKey(
        AssociationAccount,
        on_delete=models.CASCADE,
        related_name='projects',
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ✅ NEW: Progress tracking
    progress_percentage = models.IntegerField(default=0, verbose_name="Pourcentage de progression")

    # ✅ NEW: Completion dates
    actual_completion_date = models.DateField(null=True, blank=True, verbose_name="Date réelle de fin")

    def __str__(self):
        return self.name

    def calculate_progress(self):
        """Calculate project progress based on completed phases"""
        phases = self.phases.all()
        if not phases.exists():
            return 0

        validated_phases = phases.filter(is_validated=True).count()
        total_phases = phases.count()
        progress = int((validated_phases / total_phases) * 100) if total_phases > 0 else 0

        self.progress_percentage = progress
        return progress

    def calculate_task_progress(self):
        """Calculate progress based on completed tasks"""
        tasks = self.tasks.all()
        if not tasks.exists():
            return 0

        completed_tasks = tasks.filter(status='done').count()
        total_tasks = tasks.count()
        progress = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

        return progress


# Validator for CIN exactly 8 digits
cin_validator = RegexValidator(
    regex=r'^\d{8}$',
    message='CIN doit contenir exactement 8 chiffres',
    code='invalid_cin'
)


class Member(models.Model):
    name = models.CharField(max_length=100)
    cin = models.CharField(
        max_length=8,
        validators=[cin_validator],
        unique=True,
        verbose_name="CIN",
        help_text="Carte d'Identité Nationale (8 chiffres)",
        null=True,
        blank=True
    )
    address = models.CharField(max_length=100)
    email = models.EmailField(default='example@example.com')
    nationality = models.CharField(unique=False, max_length=100)
    birth_date = models.DateField()
    job = models.CharField(max_length=100)
    joining_date = models.DateField()
    role = models.CharField(max_length=100)
    association = models.ForeignKey(
        AssociationAccount,
        on_delete=models.CASCADE,
        related_name='members',
        null=True
    )
    needs_profile_completion = models.BooleanField(default=False,
                                                   help_text="Indicates if this member needs to complete their profile")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()

        if self.cin is not None and not cin_validator.regex.match(self.cin):
            raise ValidationError({
                'cin': cin_validator.message
            })

        if self.role not in ['Membre', 'autre', 'Président', 'Trésorier', 'Secrétaire générale'] and self.association:
            existing = Member.objects.filter(
                ~Q(id=self.id),
                association=self.association,
                role=self.role
            ).exists()

            if existing:
                raise ValidationError({
                    'role': f"Le rôle '{self.role}' est déjà attribué à un autre membre dans cette association. "
                            f"Seuls les rôles 'Membre' et 'autre' peuvent être partagés."
                })

    def save(self, *args, **kwargs):
        skip_validation = kwargs.pop('skip_validation', False)
        force_insert = kwargs.get('force_insert', False)
        force_update = kwargs.get('force_update', False)

        if skip_validation or force_insert or force_update:
            # Skip validation for system-created members-Auto created are auto validated
            super(Member, self).save(*args, **kwargs)
        else:
            self.full_clean()
            super(Member, self).save(*args, **kwargs)

    class Meta:
        unique_together = ('name', 'association')


# ============================================================
# ✅ NEW MODELS BELOW - Project Management System
# ============================================================

class Task(models.Model):
    """
    WHY: Tasks are individual work items within a project
    Each task can be assigned to a member and tracked through its lifecycle
    """
    STATUS_CHOICES = [
        ('todo', 'À faire'),
        ('in_progress', 'En cours'),
        ('review', 'En révision'),
        ('done', 'Terminé'),
        ('blocked', 'Bloqué'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]

    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")

    # Links to existing Project model
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,  # If project deleted, delete all its tasks
        related_name='tasks',
        verbose_name="Projet"
    )

    # Links to existing Member model
    assigned_to = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,  # If member deleted, task stays but becomes unassigned
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name="Assigné à"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo', verbose_name="Statut")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name="Priorité")

    start_date = models.DateField(null=True, blank=True, verbose_name="Date de début")
    due_date = models.DateField(null=True, blank=True, verbose_name="Date d'échéance")

    # Time tracking for resource management
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True,
                                          verbose_name="Heures estimées")
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0, verbose_name="Heures réelles")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Tâche"
        verbose_name_plural = "Tâches"


class ProjectPhase(models.Model):
    """
    WHY: Phases segment a project into stages (e.g., Planning, Execution, Testing)
    Each phase must be validated before the next one starts
    When ALL phases are validated, final report is auto-generated
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('validated', 'Validée'),
    ]

    name = models.CharField(max_length=200, verbose_name="Nom de la phase")
    description = models.TextField(verbose_name="Description")

    # Order field ensures phases execute in sequence (1, 2, 3...)
    order = models.IntegerField(verbose_name="Ordre", help_text="Ordre d'exécution de la phase")

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='phases',
        verbose_name="Projet"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Statut")

    # Validation tracking
    is_validated = models.BooleanField(default=False, verbose_name="Est validée")
    validated_by = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_phases',
        verbose_name="Validée par"
    )
    validated_at = models.DateTimeField(null=True, blank=True, verbose_name="Validée le")

    start_date = models.DateField(null=True, blank=True, verbose_name="Date de début")
    end_date = models.DateField(null=True, blank=True, verbose_name="Date de fin")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créée le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifiée le")

    def __str__(self):
        return f"{self.project.name} - Phase {self.order}: {self.name}"

    class Meta:
        ordering = ['project', 'order']
        verbose_name = "Phase de projet"
        verbose_name_plural = "Phases de projet"
        # unique_together ensures no duplicate phase orders per project
        unique_together = ['project', 'order']


class ProjectReport(models.Model):
    """
    WHY: Stores generated PDF reports for projects
    Can be intermediate reports (after meetings) or final reports (when project ends)
    Final report is auto-triggered when all phases are validated
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='reports',
        verbose_name="Projet"
    )
    generated_by = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Généré par"
    )

    # Report content
    meeting_notes = models.TextField(blank=True, verbose_name="Notes de réunion")
    summary = models.TextField(blank=True, verbose_name="Résumé")

    # PDF storage - files will be saved in media/reports/
    pdf_file = models.FileField(upload_to='reports/', null=True, blank=True, verbose_name="Fichier PDF")

    # Flag to distinguish final vs intermediate reports
    is_final_report = models.BooleanField(default=False, verbose_name="Rapport final")

    generated_at = models.DateTimeField(auto_now_add=True, verbose_name="Généré le")

    def __str__(self):
        report_type = "Final" if self.is_final_report else "Intermédiaire"
        return f"Rapport {report_type}: {self.project.name} - {self.generated_at.strftime('%Y-%m-%d')}"

    class Meta:
        ordering = ['-generated_at']
        verbose_name = "Rapport de projet"
        verbose_name_plural = "Rapports de projet"