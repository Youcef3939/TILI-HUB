from django.contrib import admin
from .models import (
    Meeting, MeetingAttendee, MeetingReport, MeetingNotification
)

class MeetingAttendeeInline(admin.TabularInline):
    model = MeetingAttendee
    extra = 0

class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'meeting_type', 'start_date', 'status', 'association')
    list_filter = ('meeting_type', 'status', 'is_virtual')
    search_fields = ('title', 'description')
    inlines = [MeetingAttendeeInline]
    date_hierarchy = 'start_date'
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'meeting_type', 'status', 'association', 'created_by')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date', 'location', 'is_virtual', 'meeting_link')
        }),
        ('Agenda & Documents', {
            'fields': ('agenda', 'agenda_document')
        }),
        ('Recurrence', {
            'fields': ('is_recurring', 'recurrence_pattern'),
            'classes': ('collapse',)
        }),
        ('Notifications', {
            'fields': ('notification_method', 'reminder_days_before'),
            'classes': ('collapse',)
        }),
    )

class MeetingAttendeeAdmin(admin.ModelAdmin):
    list_display = ('member', 'meeting', 'status', 'attendance_mode', 'special_role')
    list_filter = ('status', 'attendance_mode', 'meeting__meeting_type')
    search_fields = ('member__name', 'meeting__title', 'notes')
    # Removed autocomplete_fields to fix error

class MeetingReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'meeting', 'created_by', 'created_at', 'is_approved')
    list_filter = ('is_approved', 'meeting__meeting_type')
    search_fields = ('title', 'summary', 'meeting__title')
    # Removed autocomplete_fields to fix error

class MeetingNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'meeting', 'notification_type', 'is_sent', 'is_read')
    list_filter = ('notification_type', 'is_sent', 'is_read', 'method')
    search_fields = ('title', 'message', 'user__email', 'meeting__title')
    readonly_fields = ('created_at', 'sent_at', 'read_at')

# Register models
admin.site.register(Meeting, MeetingAdmin)
admin.site.register(MeetingAttendee, MeetingAttendeeAdmin)
admin.site.register(MeetingReport, MeetingReportAdmin)
admin.site.register(MeetingNotification, MeetingNotificationAdmin)