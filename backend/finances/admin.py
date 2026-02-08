from django.contrib import admin
from .models import Donor, Transaction, BudgetAllocation, FinancialReport, ForeignDonationReport

admin.site.register(ForeignDonationReport)

@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'tax_id', 'is_anonymous', 'total_donations')
    list_filter = ('is_anonymous', 'created_at')
    search_fields = ('name', 'email', 'tax_id')
    readonly_fields = ('total_donations',)
    fieldsets = (
        ('Donor Information', {
            'fields': ('name', 'email', 'phone', 'address', 'tax_id', 'is_anonymous')
        }),
        ('Additional Information', {
            'fields': ('notes', 'total_donations')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction_type', 'category', 'amount', 'date', 'project', 'status')
    list_filter = ('transaction_type', 'category', 'status', 'date')
    search_fields = ('description', 'reference_number')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Transaction Details', {
            'fields': ('transaction_type', 'category', 'amount', 'description', 'date')
        }),
        ('Related Entities', {
            'fields': ('project', 'donor', 'reference_number')
        }),
        ('Verification', {
            'fields': ('status', 'verified_by', 'verification_date', 'verification_notes')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
    list_per_page = 20


@admin.register(BudgetAllocation)
class BudgetAllocationAdmin(admin.ModelAdmin):
    list_display = ('project', 'allocated_amount', 'used_amount', 'remaining_amount', 'utilization_percentage')
    search_fields = ('project__name',)
    readonly_fields = ('used_amount', 'remaining_amount', 'utilization_percentage', 'created_at', 'updated_at')
    fieldsets = (
        ('Budget Information', {
            'fields': ('project', 'allocated_amount', 'used_amount', 'remaining_amount', 'utilization_percentage')
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(FinancialReport)
class FinancialReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'report_type', 'start_date', 'end_date', 'status', 'created_at')
    list_filter = ('report_type', 'status', 'start_date', 'end_date')
    search_fields = ('title',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Report Information', {
            'fields': ('report_type', 'title', 'start_date', 'end_date', 'status')
        }),
        ('Report File', {
            'fields': ('report_file',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'generated_by', 'created_at', 'updated_at')
        }),
    )