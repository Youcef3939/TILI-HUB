from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from users.models import CustomUser, AssociationAccount
from api.models import Member

# Meeting types and statuses
MEETING_TYPES = (
    ('regular', 'Regular Monthly Meeting'),
    ('board', 'Board Meeting'),
    ('extraordinary', 'Extraordinary Meeting'),
    ('general_assembly', 'General Assembly'),
    ('committee', 'Committee Meeting'),
    ('other', 'Other'),
)

MEETING_STATUSES = (
    ('scheduled', 'Scheduled'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
    ('postponed', 'Postponed'),
)

ATTENDANCE_STATUSES = (
    ('present', 'Present'),
    ('absent', 'Absent'),
    ('excused', 'Excused'),
    ('late', 'Late'),
)

NOTIFICATION_METHODS = (
    ('email', 'Email'),
    ('platform', 'Platform'),
    ('both', 'Both Email and Platform'),
)


class Meeting(models.Model):
    """Model for association meetings"""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    meeting_type = models.CharField(max_length=50, choices=MEETING_TYPES, default='regular')
    status = models.CharField(max_length=20, choices=MEETING_STATUSES, default='scheduled')
    parent_meeting = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recurring_instances'
    )
    # Association and creator
    association = models.ForeignKey(
        AssociationAccount,
        on_delete=models.CASCADE,
        related_name='meetings'
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_meetings'
    )


    # Meeting schedule details
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    is_virtual = models.BooleanField(default=False)
    meeting_link = models.URLField(blank=True, null=True)

    # Agenda
    agenda = models.TextField(blank=True)
    agenda_document = models.FileField(upload_to='meetings/agenda/', blank=True, null=True)

    # Recurrence for scheduled meetings (JSON field for flexibility)
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.JSONField(null=True, blank=True,
                                          help_text='JSON with frequency, interval, etc.')

    # Notification settings
    notification_method = models.CharField(
        max_length=20,
        choices=NOTIFICATION_METHODS,
        default='both'
    )
    reminder_days_before = models.IntegerField(default=2)

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.get_meeting_type_display()} ({self.start_date.date()})"

    def clean(self):
        """Validate meeting dates"""
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError("End date cannot be before start date")

        # For virtual meetings, require a meeting link
        if self.is_virtual and not self.meeting_link:
            raise ValidationError("Virtual meetings must have a meeting link")

    def save(self, *args, **kwargs):
        """Override save to ensure validation runs"""
        self.clean()
        super().save(*args, **kwargs)

    @property
    def is_upcoming(self):
        """Check if the meeting is in the future"""
        return self.start_date > timezone.now()

    @property
    def has_passed(self):
        """Check if the meeting has ended"""
        return self.end_date < timezone.now()

    @property
    def needs_report(self):
        """Check if a meeting has been completed but doesn't have a report yet"""
        return (
                self.status == 'completed' and
                not self.reports.exists()
        )

    @property
    def attendee_count(self):
        """Get the number of attendees marked as present"""
        return self.attendees.filter(status='present').count()


class MeetingAttendee(models.Model):
    """Model to track attendance at meetings"""
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='attendees'
    )
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='meeting_attendances'
    )
    status = models.CharField(
        max_length=20,
        choices=ATTENDANCE_STATUSES,
        default='absent'
    )
    # New field for attendance mode
    attendance_mode = models.CharField(
        max_length=20,
        choices=[
            ('in_person', 'In-Person'),
            ('virtual', 'Virtual'),
            ('undecided', 'Undecided'),
        ],
        default='in_person'
    )
    notes = models.TextField(blank=True)

    # If the attendee has a custom role for this meeting (speaker, moderator, etc.)
    special_role = models.CharField(max_length=100, blank=True)

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('meeting', 'member')

    def __str__(self):
        return f"{self.member.name} - {self.meeting.title} - {self.get_status_display()}"


class MeetingReport(models.Model):
    """Model for summary reports generated after meetings"""
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    title = models.CharField(max_length=255)
    summary = models.TextField()

    # Document generated
    report_file = models.FileField(
        upload_to='meetings/reports/',
        blank=True,
        null=True
    )

    # Approval information
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_reports'
    )
    approval_date = models.DateTimeField(null=True, blank=True)

    # Creator information
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reports'
    )

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report: {self.meeting.title} ({self.meeting.start_date.date()})"


class MeetingNotification(models.Model):
    """Model to track notifications sent for meetings"""
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='meeting_notifications'
    )

    # Notification details
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=[
            ('reminder', 'Meeting Reminder'),
            ('update', 'Meeting Update'),
            ('cancellation', 'Meeting Cancellation'),
            ('summary', 'Meeting Summary Available'),
        ],
        default='reminder'
    )

    # Delivery method and status
    method = models.CharField(
        max_length=20,
        choices=NOTIFICATION_METHODS,
        default='both'
    )
    is_sent = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    # Extra data for responses (JSON field)
    extra_data = models.JSONField(null=True, blank=True)

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.notification_type} for {self.meeting.title} to {self.user.email}"

