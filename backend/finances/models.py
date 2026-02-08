from django.db import models
from django.utils import timezone
from decimal import Decimal
from api.models import Project
from django.contrib.auth import get_user_model

User = get_user_model()


TRANSACTION_CATEGORIES = [
    ('donation', 'Donation'),
    ('membership_fee', 'Membership Fee'),
    ('grant', 'Grant'),
    ('project_expense', 'Project Expense'),
    ('operational_cost', 'Operational Cost'),
    ('salary', 'Salary'),
    ('tax', 'Tax Payment'),
    ('other_income', 'Other Income'),
    ('other_expense', 'Other Expense')
]


class Donor(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Donor type fields
    is_member = models.BooleanField(default=False, help_text="Indicates if the donor is a member of the association")
    is_internal = models.BooleanField(default=False,
                                      help_text="Indicates if the donor is internal to the organization but not a member")
    member_id = models.IntegerField(null=True, blank=True,
                                    help_text="Reference to the member if this donor is a member")

    # Active status
    is_active = models.BooleanField(default=True, help_text="Indicates if the donor is currently active")

    # References
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_donors'
    )
    association = models.ForeignKey(
        'users.AssociationAccount',
        on_delete=models.CASCADE,
        null=True,
        related_name='donors'
    )

    def __str__(self):
        return self.name

    @property
    def total_donations(self):
        return self.transactions.filter(
            transaction_type='income',
            status='verified'
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0')


class BudgetAllocation(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='budget_allocations'
    )
    # Add association field
    association = models.ForeignKey(
        'users.AssociationAccount',
        on_delete=models.CASCADE,
        null=True,
        related_name='budget_allocations'
    )
    allocated_amount = models.DecimalField(max_digits=15, decimal_places=2)
    used_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_budgets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Budget for {self.project.name}: {self.allocated_amount}"

    @property
    def remaining_amount(self):
        return self.allocated_amount - self.used_amount

    @property
    def utilization_percentage(self):
        if self.allocated_amount == 0:
            return 0
        return (self.used_amount / self.allocated_amount) * 100
class FinancialReport(models.Model):
    REPORT_TYPES = [
        ('monthly', 'Monthly Report'),
        ('quarterly', 'Quarterly Report'),
        ('annual', 'Annual Report'),
        ('custom', 'Custom Report')
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('finalized', 'Finalized')
    ]

    report_type = models.CharField(max_length=10, choices=REPORT_TYPES)
    title = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='draft'
    )
    report_file = models.FileField(
        upload_to='finance/reports/',
        blank=True,
        null=True
    )
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
class ForeignDonationReport(models.Model):
    REPORT_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('sent', 'Envoyé'),
        ('acknowledged', 'Accusé de réception'),
        ('completed', 'Processus terminé')
    ]
    journal_publication_text = models.TextField(blank=True, null=True)

    transaction = models.OneToOneField(
        'Transaction',  # Use string instead of direct class reference
        on_delete=models.CASCADE,
        related_name='foreign_donation_report'
    )
    report_required = models.BooleanField(default=True)
    letter_generated = models.BooleanField(default=False)
    letter_file = models.FileField(
        upload_to='finance/foreign_donation_letters/',
        blank=True,
        null=True
    )
    journal_publication_reference = models.CharField(max_length=255, blank=True, null=True)
    journal_publication_date = models.DateField(blank=True, null=True)
    reporting_deadline = models.DateField()
    report_status = models.CharField(
        max_length=20,
        choices=REPORT_STATUS_CHOICES,
        default='pending'
    )
    sent_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Foreign Donation Report for Transaction {self.transaction.id}"

    def days_until_deadline(self):
        if self.reporting_deadline:
            from django.utils import timezone
            today = timezone.now().date()
            delta = self.reporting_deadline - today
            return delta.days
        return None

    def save(self, *args, **kwargs):
        # If this is a new record, set the reporting deadline
        if not self.pk and not self.reporting_deadline:
            from django.utils import timezone
            from datetime import timedelta
            # Set deadline to 30 days from transaction date
            self.reporting_deadline = self.transaction.date + timedelta(days=30)
        super().save(*args, **kwargs)

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense')
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected')
    ]

    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=20, choices=TRANSACTION_CATEGORIES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField()
    date = models.DateField()
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    is_project_wide = models.BooleanField(
        default=False,
        help_text="Indicates if this expense applies to the entire project"
    )
    # Added association field
    association = models.ForeignKey(
        'users.AssociationAccount',
        on_delete=models.CASCADE,
        null=True,
        related_name='transactions'
    )
    # Other fields remain the same
    budget_allocation = models.ForeignKey(
        BudgetAllocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    donor = models.ForeignKey(
        Donor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    document = models.FileField(
        upload_to='finance/transactions/',
        blank=True,
        null=True
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_transactions'
    )
    verification_date = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount} - {self.date}"




