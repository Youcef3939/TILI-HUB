from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class Notification(models.Model):
    """
    Model to store notifications
    """
    # Notification types
    NOTIFICATION_TYPES = (
        ('meeting_scheduled', _('Meeting Scheduled')),
        ('meeting_cancelled', _('Meeting Cancelled')),
        ('meeting_reminder', _('Meeting Reminder')),
        ('report_due', _('Report Due')),
        ('report_overdue', _('Report Overdue')),
        ('transaction_created', _('Transaction Created')),
        ('transaction_updated', _('Transaction Updated')),
        ('transaction_deleted', _('Transaction Deleted')),
        ('donation_received', _('Donation Received')),
        ('user_joined', _('User Joined')),
        ('user_left', _('User Left')),
        ('admin_action_required', _('Admin Action Required')),
        ('official_letter_required', _('Official Letter Required')),
        ('budget_threshold', _('Budget Threshold')),
        ('monthly_summary', _('Monthly Summary')),
    )

    # Priority levels
    PRIORITY_LEVELS = (
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
    )

    # Fields
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
        help_text=_('Specific user to receive this notification (leave blank for all)')
    )

    recipient_role = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text=_('Role of users who should receive this notification (leave blank for all)')
    )

    title = models.CharField(
        max_length=255,
        help_text=_('Short title for the notification')
    )

    message = models.TextField(
        help_text=_('Notification message')
    )

    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        help_text=_('Type of notification')
    )

    related_object_id = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text=_('ID of the related object (e.g., meeting ID, transaction ID)')
    )

    related_object_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text=_('Type of the related object (e.g., meeting, transaction)')
    )

    url = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text=_('URL to redirect to when notification is clicked')
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('When the notification was created')
    )

    read = models.BooleanField(
        default=False,
        help_text=_('Whether the notification has been read')
    )

    read_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_('When the notification was read')
    )

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_LEVELS,
        default='medium',
        help_text=_('Priority level of the notification')
    )

    requires_action = models.BooleanField(
        default=False,
        help_text=_('Whether the notification requires action from the user')
    )

    action_deadline = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_('Deadline for required action')
    )

    action_completed = models.BooleanField(
        default=False,
        help_text=_('Whether the required action has been completed')
    )

    action_completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_('When the required action was completed')
    )

    # Additional properties for special notification types
    requires_official_letter = models.BooleanField(
        default=False,
        help_text=_('Whether this notification requires sending an official letter')
    )

    official_letter_recipient = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text=_('Recipient for required official letter')
    )

    official_letter_sent = models.BooleanField(
        default=False,
        help_text=_('Whether the official letter has been sent')
    )

    official_letter_sent_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_('When the official letter was sent')
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['read']),
            models.Index(fields=['recipient_role']),
            models.Index(fields=['priority']),
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title}"

    def mark_as_read(self):
        """Mark the notification as read"""
        from django.utils import timezone
        self.read = True
        self.read_at = timezone.now()
        self.save(update_fields=['read', 'read_at'])

    def mark_action_completed(self):
        """Mark the required action as completed"""
        from django.utils import timezone
        self.action_completed = True
        self.action_completed_at = timezone.now()
        self.save(update_fields=['action_completed', 'action_completed_at'])

    def mark_letter_sent(self):
        """Mark the official letter as sent"""
        from django.utils import timezone
        self.official_letter_sent = True
        self.official_letter_sent_at = timezone.now()
        self.save(update_fields=['official_letter_sent', 'official_letter_sent_at'])


class OfficialLetterLog(models.Model):
    """
    Model to track official letters required for certain notifications
    """
    notification = models.OneToOneField(
        Notification,
        on_delete=models.CASCADE,
        related_name='letter_log',
        help_text=_('Related notification')
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_letters',
        help_text=_('User who sent the letter')
    )

    recipient = models.CharField(
        max_length=255,
        help_text=_('Recipient of the letter')
    )

    subject = models.CharField(
        max_length=255,
        help_text=_('Subject of the letter')
    )

    content = models.TextField(
        help_text=_('Content of the letter')
    )

    reference_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text=_('Reference number for the letter')
    )

    tracking_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text=_('Postal tracking number')
    )

    letter_file = models.FileField(
        upload_to='official_letters/',
        blank=True,
        null=True,
        help_text=_('Digital copy of the letter')
    )

    date_prepared = models.DateTimeField(
        auto_now_add=True,
        help_text=_('When the letter was prepared')
    )

    date_sent = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_('When the letter was sent')
    )

    proof_of_sending = models.FileField(
        upload_to='official_letters/proof/',
        blank=True,
        null=True,
        help_text=_('Proof of sending (receipt, etc.)')
    )

    class Meta:
        ordering = ['-date_prepared']

    def __str__(self):
        return f"Letter: {self.subject} - {self.recipient}"