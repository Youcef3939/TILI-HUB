from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Meeting, MeetingAttendee, MeetingReport, MeetingNotification
from .serializers import (
    MeetingSerializer, MeetingAttendeeSerializer,
    MeetingReportSerializer, MeetingNotificationSerializer, MeetingListSerializer,
    ReportGenerationSerializer
)
from users.AssociationFilterMixin import AssociationFilterMixin
from users.permissions import has_permission, MeetingsPermission
from api.models import Member
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.conf import settings
import os
import json
from datetime import timedelta
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)


class MeetingViewSet(AssociationFilterMixin, viewsets.ModelViewSet):
    """ViewSet for managing meetings"""
    permission_classes = [permissions.IsAuthenticated, MeetingsPermission]
    serializer_class = MeetingSerializer
    queryset = Meeting.objects.all()  # Base queryset

    def get_queryset(self):
        """Get meetings filtered by association and optional query parameters"""
        # First get the base queryset with select_related for optimization
        queryset = Meeting.objects.all().select_related('association', 'created_by')

        # Then apply association filter from mixin
        queryset = super().get_queryset()

        # Additional filters based on query parameters
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        meeting_type = self.request.query_params.get('meeting_type')
        if meeting_type:
            queryset = queryset.filter(meeting_type=meeting_type)

        # Filter by date range
        start_after = self.request.query_params.get('start_after')
        if start_after:
            queryset = queryset.filter(start_date__gte=start_after)

        end_before = self.request.query_params.get('end_before')
        if end_before:
            queryset = queryset.filter(end_date__lte=end_before)

        # Filter for upcoming meetings
        upcoming = self.request.query_params.get('upcoming')
        if upcoming and upcoming.lower() == 'true':
            queryset = queryset.filter(start_date__gt=timezone.now())

        # Filter for past meetings
        past = self.request.query_params.get('past')
        if past and past.lower() == 'true':
            queryset = queryset.filter(end_date__lt=timezone.now())

        # Filter for meetings needing reports
        needs_report = self.request.query_params.get('needs_report')
        if needs_report and needs_report.lower() == 'true':
            queryset = queryset.filter(
                status='completed'
            ).exclude(
                reports__isnull=False
            )

        return queryset

    def _create_recurring_meetings(self, meeting):
        """Create instances for recurring meetings"""
        try:
            recurrence = meeting.recurrence_pattern
            if not recurrence:
                print("No recurrence pattern found for recurring meeting.")
                return

            # Extract pattern details
            frequency = recurrence.get('frequency', 'monthly')
            interval = recurrence.get('interval', 1)
            end_after = recurrence.get('end_after', 12)

            print(f"Creating {end_after} recurring meetings with {frequency} frequency, interval {interval}")

            # Original start/end times
            start_date = meeting.start_date
            end_date = meeting.end_date
            duration = end_date - start_date

            # Generate future dates
            for i in range(1, min(int(end_after), 50)):  # Limit to 50 for safety
                if frequency == 'daily':
                    next_start = start_date + timedelta(days=i * interval)
                elif frequency == 'weekly':
                    next_start = start_date + timedelta(weeks=i * interval)
                elif frequency == 'monthly':
                    # Handle monthly recurrence
                    next_month = (start_date.month - 1 + (i * interval)) % 12 + 1
                    next_year = start_date.year + ((start_date.month - 1 + (i * interval)) // 12)
                    day = min(start_date.day, 28)  # Ensure valid day for all months

                    next_start = start_date.replace(year=next_year, month=next_month, day=day)
                else:
                    continue

                next_end = next_start + duration

                # Create a new meeting instance (as a copy of the original)
                meeting_data = {
                    'title': meeting.title,
                    'description': meeting.description,
                    'meeting_type': meeting.meeting_type,
                    'start_date': next_start,
                    'end_date': next_end,
                    'location': meeting.location,
                    'is_virtual': meeting.is_virtual,
                    'meeting_link': meeting.meeting_link,
                    'agenda': meeting.agenda,
                    'association': meeting.association,
                    'created_by': meeting.created_by,
                    'notification_method': meeting.notification_method,
                    'reminder_days_before': meeting.reminder_days_before,
                    'is_recurring': False,  # Set to False to avoid infinite recursion
                    # Remove the parent_meeting field since it doesn't exist in the model
                    # 'parent_meeting': meeting.id  # This line causes the error
                }

                # Create the meeting
                new_meeting = Meeting.objects.create(**meeting_data)
                print(f"Created recurring meeting {i} with id {new_meeting.id} for date {next_start}")

        except Exception as e:
            print(f"Error creating recurring meetings: {str(e)}")
            import traceback
            traceback.print_exc()
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return MeetingListSerializer
        return MeetingSerializer

    def perform_create(self, serializer):
        """Create meeting and set the association and creator"""
        # Save the initial meeting
        meeting = serializer.save(
            created_by=self.request.user,
            association=self.request.user.association
        )

        # Process recurrence if enabled
        if meeting.is_recurring:
            # Check if recurrence_pattern exists either as an attribute or in the serializer data
            recurrence_pattern = getattr(meeting, 'recurrence_pattern', None)
            if not recurrence_pattern and hasattr(serializer, 'validated_data'):
                recurrence_pattern = serializer.validated_data.get('recurrence_pattern')

            if recurrence_pattern:
                # Log for debugging
                print(f"Creating recurring meetings with pattern: {recurrence_pattern}")
                self._create_recurring_meetings(meeting)
            else:
                print("Warning: Meeting marked as recurring but no recurrence pattern found")

    @action(detail=True, methods=['post'])
    def add_attendees(self, request, pk=None):
        """Add attendees to a meeting"""
        meeting = self.get_object()
        attendees_data = request.data.get('attendees', [])

        if not attendees_data:
            return Response(
                {"error": "No attendees data provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process each attendee
        created_attendees = []
        updated_attendees = []
        errors = []
        new_attendee_emails = []  # Track new attendees for notification
        new_attendees = []  # Track actual new attendee objects

        for attendee_data in attendees_data:
            try:
                # Check if 'member' is in attendee data
                if 'member' not in attendee_data:
                    errors.append({"error": "Member ID is required", "data": attendee_data})
                    continue

                # Get the member
                member_id = attendee_data.get('member')

                if not member_id:
                    errors.append({"error": "Member ID is required", "data": attendee_data})
                    continue

                try:
                    member = Member.objects.get(
                        association=request.user.association,
                        pk=member_id
                    )
                except Member.DoesNotExist:
                    errors.append({"error": f"Member with ID {member_id} not found", "data": attendee_data})
                    continue

                # Default status (changed from 'absent' to 'pending')
                default_status = attendee_data.get('status', 'pending')

                # Get attendance mode (in_person, virtual, or undecided)
                attendance_mode = attendee_data.get('attendance_mode', 'undecided')

                # Create or update attendee
                attendee, created = MeetingAttendee.objects.update_or_create(
                    meeting=meeting,
                    member=member,
                    defaults={
                        'status': default_status,
                        'notes': attendee_data.get('notes', ''),
                        'special_role': attendee_data.get('special_role', ''),
                        'attendance_mode': attendance_mode
                    }
                )

                if created:
                    created_attendees.append(MeetingAttendeeSerializer(attendee).data)
                    new_attendee_emails.append(member.email)  # Track for notification
                    new_attendees.append(attendee)  # Track the actual attendee object
                else:
                    updated_attendees.append(MeetingAttendeeSerializer(attendee).data)

            except Exception as e:
                errors.append({"error": str(e), "data": attendee_data})

        # Send notifications to newly added attendees
        notifications_sent = 0
        if new_attendee_emails and meeting.notification_method in ['email', 'both']:
            try:
                notifications_sent = self._send_attendee_notifications(
                    meeting, new_attendee_emails, request.user, new_attendees
                )
            except Exception as e:
                pass

        return Response({
            "created": created_attendees,
            "updated": updated_attendees,
            "errors": errors,
            "notifications_sent": notifications_sent
        })

    def _send_attendee_notifications(self, meeting, emails, sender_user, attendee_objects=None):
        """Send notifications to newly added attendees"""
        # Generate notification message
        title = f"Vous avez été invité à une réunion: {meeting.title}"
        message = f"Vous avez été invité à la réunion '{meeting.title}' prévu pour {meeting.start_date.strftime('%Y-%m-%d %H:%M')}. Merci de répondre avec votre disponibilité."

        # Create notifications for users associated with these emails
        notifications_sent = 0

        # Create a mapping of email to attendee object if provided
        attendee_map = {}
        if attendee_objects:
            for attendee in attendee_objects:
                try:
                    attendee_map[attendee.member.email] = attendee
                except:
                    # If any error occurs, just continue without this mapping
                    pass

        for email in emails:
            try:
                # Find the corresponding member
                member = Member.objects.get(email=email, association=meeting.association)

                # Find the attendee record
                attendee = None
                if email in attendee_map:
                    attendee = attendee_map[email]
                else:
                    attendee = MeetingAttendee.objects.get(meeting=meeting, member=member)

                if not attendee:
                    continue

                # Find users with this email in the association
                users = meeting.association.users.filter(email=email)
                if not users.exists():
                    # Even if there's no user account, we should still send an email
                    # to the member's email address
                    self._send_direct_email_notification(email, meeting, attendee)
                    notifications_sent += 1
                    continue

                user = users.first()

                # Create notification record with attendee info
                notification = MeetingNotification.objects.create(
                    meeting=meeting,
                    user=user,
                    title=title,
                    message=message,
                    notification_type='invitation',
                    method=meeting.notification_method,
                    is_sent=False,
                    extra_data={'attendee_id': attendee.id}
                )

                # Send email notification
                self._send_direct_email_notification(user.email, meeting, attendee, notification)
                notifications_sent += 1

            except (Member.DoesNotExist, MeetingAttendee.DoesNotExist):
                continue
            except Exception:
                continue

        return notifications_sent

    def _send_direct_email_notification(self, email, meeting, attendee, notification=None):
        """Send an email notification to a member"""
        try:
            # Get base URL from settings
            base_url = getattr(settings, 'EMAIL_BASE_URL', 'http://localhost:5173')

            # Ensure base_url doesn't have a trailing slash
            if base_url.endswith('/'):
                base_url = base_url[:-1]

            # Generate token for response links
            token = f"mtg-{attendee.id}-{meeting.id}"

            # Create context for email template
            context = {
                'email': email,
                'meeting': meeting,
                'title': f"Vous avez été invité à la réunion: {meeting.title}",
                'message': f"Vous avez été invité à la réunion '{meeting.title}' prévu pour {meeting.start_date.strftime('%Y-%m-%d %H:%M')}. Merci de répondre avec votre disponibilité.",
                'meeting_date': meeting.start_date.strftime('%A, %B %d, %Y'),
                'meeting_time': meeting.start_date.strftime('%I:%M %p'),
                'meeting_location': meeting.location if not meeting.is_virtual else 'Virtual Meeting',
                'meeting_link': meeting.meeting_link if meeting.is_virtual else None,
                'attendee': attendee,
                'notification_type': 'invitation',
                'base_url': base_url,
            }

            if notification:
                context['notification'] = notification
                context['user'] = notification.user

            # Render email templates
            html_message = render_to_string("meetings/email_notification.html", context=context)
            plain_message = strip_tags(html_message)

            # Send the email
            msg = EmailMultiAlternatives(
                subject=f"Meeting Invitation: {meeting.title}",
                body=plain_message,
                from_email="noreply.myorg@gmail.com",
                to=[email]
            )

            msg.attach_alternative(html_message, "text/html")
            msg.send()

            # Mark notification as sent if provided
            if notification:
                notification.is_sent = True
                notification.sent_at = timezone.now()
                notification._skip_signal = True  # Prevent signal handler from sending again
                notification.save()

            return True
        except Exception:
            return False

    @action(detail=True, methods=['post'])
    def generate_report(self, request, pk=None):
        """Generate a PDF report for a meeting"""
        meeting = self.get_object()

        # Validate the request data
        serializer = ReportGenerationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get report parameters
        include_attendance = serializer.validated_data.get('include_attendance', True)
        summary = serializer.validated_data.get('summary', "")
        report_title = serializer.validated_data.get('report_title', f"Meeting Report: {meeting.title}")

        # Generate the PDF report
        pdf_file, report_summary = self._generate_pdf_report(
            meeting,
            include_attendance,
            summary,
            report_title
        )

        # Create a MeetingReport object
        report = MeetingReport.objects.create(
            meeting=meeting,
            title=report_title,
            summary=summary,
            created_by=request.user
        )

        # Save the PDF file to the report
        report.report_file.save(
            f"meeting_report_{meeting.id}_{timezone.now().strftime('%Y%m%d')}.pdf",
            ContentFile(pdf_file.getvalue())
        )

        # Update meeting status if it was not already completed
        if meeting.status != 'completed':
            meeting.status = 'completed'
            meeting.save()

        # Return the report data
        return Response(
            MeetingReportSerializer(report).data,
            status=status.HTTP_201_CREATED
        )

    def _generate_pdf_report(self, meeting, include_attendance, summary, title):


        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                topMargin=36, bottomMargin=36,
                                leftMargin=50, rightMargin=50)
        styles = getSampleStyleSheet()
        elements = []


        title_style = ParagraphStyle(
            name='EnhancedTitle',
            parent=styles['Title'],
            fontSize=20,
            alignment=1,
            spaceAfter=24,
            textColor=colors.navy,
            fontName='Helvetica-Bold'
        )

        heading_style = ParagraphStyle(
            name='EnhancedHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceBefore=16,
            spaceAfter=12,
            textColor=colors.navy,
            fontName='Helvetica-Bold',
            borderWidth=0,
            borderPadding=6,
            borderRadius=4
        )

        normal_style = ParagraphStyle(
            name='EnhancedNormal',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            spaceAfter=8
        )


        elements.append(Paragraph(title, title_style))
        elements.append(Spacer(1, 16))


        meeting_details = [
            ["Réunion", meeting.title],
            ["Type", meeting.get_meeting_type_display()],
            ["Date", meeting.start_date.strftime('%A, %d %B %Y')],
            ["Heure", f"{meeting.start_date.strftime('%H:%M')} - {meeting.end_date.strftime('%H:%M')}"],
            ["Lieu", meeting.location if not meeting.is_virtual else "Réunion Virtuelle"],
            ["Statut", meeting.get_status_display()]
        ]

        # Create details table with enhanced styling
        details_table = Table(meeting_details, colWidths=[120, 380])
        details_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lavender),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.navy),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 1, colors.navy),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 25))


        text_content = f"# {title}\n\n"
        text_content += f"Réunion: {meeting.title}\n"
        text_content += f"Date: {meeting.start_date.strftime('%A, %d %B %Y')}\n"
        text_content += f"Heure: {meeting.start_date.strftime('%H:%M')} - {meeting.end_date.strftime('%H:%M')}\n"
        text_content += f"Lieu: {meeting.location if not meeting.is_virtual else 'Réunion Virtuelle'}\n\n"


        if meeting.agenda:
            elements.append(Paragraph("Ordre du jour", heading_style))
            elements.append(Spacer(1, 8))


            agenda_paragraphs = meeting.agenda.split('\n')
            for para in agenda_paragraphs:
                if para.strip():
                    elements.append(Paragraph(para, normal_style))

            elements.append(Spacer(1, 18))

            # Add to text content
            text_content += "## Ordre du jour\n"
            text_content += meeting.agenda + "\n\n"


        include_attendance = True

        if meeting.attendees.exists():
            elements.append(Paragraph("Liste de présence", heading_style))
            elements.append(Spacer(1, 8))

            # Create attendance table with enhanced styling
            attendance_data = [["Membre", "Statut"]]

            for attendee in meeting.attendees.all().select_related('member'):
                attendance_data.append([
                    attendee.member.name,
                    attendee.get_status_display(),
                ])

            attendance_table = Table(attendance_data, colWidths=[220, 130, 130])
            attendance_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lavender),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.navy),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ('BOX', (0, 0), (-1, -1), 1, colors.navy),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                # Add zebra striping for better readability
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
            ]))
            elements.append(attendance_table)

            # Add summary of attendance numbers
            present_count = meeting.attendees.filter(status='present').count()
            absent_count = meeting.attendees.filter(status='absent').count()
            excused_count = meeting.attendees.filter(status='excused').count()
            total_count = meeting.attendees.count()

            attendance_summary = f"Total des membres: {total_count} (Présents: {present_count}, " \
                                 f"Absents: {absent_count}, Excusés: {excused_count})"

            summary_style = ParagraphStyle(
                name='SummaryStyle',
                parent=normal_style,
                fontSize=10,
                textColor=colors.navy,
                backColor=colors.lavender,
                borderColor=colors.navy,
                borderWidth=0.5,
                borderPadding=5,
                borderRadius=3,
                spaceAfter=12,
                alignment=1  # Center alignment
            )

            elements.append(Spacer(1, 10))
            elements.append(Paragraph(attendance_summary, summary_style))
            elements.append(Spacer(1, 18))

            # Add to text content
            text_content += "## Liste de présence\n"
            text_content += f"Total des membres: {total_count} (Présents: {present_count}, Absents: {absent_count}, Excusés: {excused_count})\n\n"

            for attendee in meeting.attendees.all().select_related('member'):
                text_content += f"- {attendee.member.name}: {attendee.get_status_display()}\n"
            text_content += "\n"
        else:
            # Even if there are no attendees, add an empty attendance section
            elements.append(Paragraph("Liste de présence", heading_style))
            elements.append(Spacer(1, 8))
            elements.append(Paragraph("Aucun participant n'a été enregistré pour cette réunion.", normal_style))
            elements.append(Spacer(1, 18))

            # Add to text content
            text_content += "## Liste de présence\n"
            text_content += "Aucun participant n'a été enregistré pour cette réunion.\n\n"

        # THIRD: Add summary (now called "Points clés discutés")
        if summary:
            elements.append(Paragraph("Points clés discutés", heading_style))
            elements.append(Spacer(1, 8))

            # Format summary text
            summary_paragraphs = summary.split('\n')
            for para in summary_paragraphs:
                if para.strip():
                    elements.append(Paragraph(para, normal_style))

            elements.append(Spacer(1, 18))

            # Add to text content
            text_content += f"## Points clés discutés\n{summary}\n\n"

        # Add page number and a divider line
        from reportlab.platypus import PageBreak, HRFlowable
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey, spaceAfter=10))

        # Add footer with generation info
        footer_text = f"Rapport généré le {timezone.now().strftime('%d-%m-%Y %H:%M')} par {meeting.association.name}"
        footer_style = ParagraphStyle(
            name='Footer',
            parent=styles["Italic"],
            fontSize=9,
            textColor=colors.darkgrey,
            alignment=1  # Center alignment
        )
        elements.append(Paragraph(footer_text, footer_style))

        text_content += f"\nRapport généré le {timezone.now().strftime('%d-%m-%Y %H:%M')}"

        # Build the PDF with page numbers
        class FooterCanvas(canvas.Canvas):
            def __init__(self, *args, **kwargs):
                canvas.Canvas.__init__(self, *args, **kwargs)
                self.pages = []

            def showPage(self):
                self.pages.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                page_count = len(self.pages)
                for page in self.pages:
                    self.__dict__.update(page)
                    self.draw_page_number(page_count)
                    canvas.Canvas.showPage(self)
                canvas.Canvas.save(self)

            def draw_page_number(self, page_count):
                page = f"Page {self._pageNumber} sur {page_count}"
                self.setFont("Helvetica", 9)
                self.setFillColor(colors.darkgrey)
                self.drawRightString(letter[0] - 50, 30, page)

        doc.build(elements, canvasmaker=FooterCanvas)

        # Return the PDF buffer and text content
        return buffer, text_content

    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """Mark a meeting as completed"""
        meeting = self.get_object()

        # Update status
        meeting.status = 'completed'
        meeting.save()

        return Response(
            MeetingSerializer(meeting).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def generate_report_template(self, request, pk=None):
        """Generate a template for the meeting report (Procès-Verbal)"""
        meeting = self.get_object()

        # Check if meeting is completed
        if meeting.status != 'completed':
            return Response(
                {"error": "Le rapport ne peut être généré que pour une réunion terminée."},
                status=400
            )

        # Generate template based on meeting info
        from django.utils import timezone
        from django.utils.formats import date_format

        # Get attendees information
        attendees = meeting.attendees.all()
        present_attendees = attendees.filter(status='present')

        # Format meeting data for report
        formatted_date = date_format(meeting.start_date, format="l j F Y")
        formatted_time = date_format(meeting.start_date, format="H:i")

        # Create report template
        title = f"Procès-Verbal : {meeting.title}"
        summary = f"""# {title}

    ## Informations Générales
    - **Date de la réunion:** {formatted_date}
    - **Heure:** {formatted_time}
    - **Lieu:** {meeting.location or "Non spécifié"}
    - **Présents:** {present_attendees.count()} membres sur {attendees.count()} invités

    ## Ordre du jour
    {meeting.agenda or "Aucun ordre du jour défini."}

    ## Points discutés
    1. 
    2. 
    3. 

    ## Décisions prises
    1. 
    2. 

    ## Actions à entreprendre
    | Action | Responsable | Échéance |
    |--------|-------------|----------|
    |        |             |          |
    |        |             |          |

    ## Prochaine réunion
    Date prévue: À déterminer

    ## Approbation
    Ce procès-verbal a été approuvé le: __________________

    Signature du président: __________________
    Signature du secrétaire: __________________
    """

        # Check if a report already exists
        existing_report = meeting.reports.first()

        if existing_report:
            # Update existing report if it's empty or update was requested
            if not existing_report.summary or len(existing_report.summary) < 50:
                existing_report.summary = summary
                existing_report.save()

                serializer = MeetingReportSerializer(existing_report)
                return Response({
                    "message": "Le modèle de Procès-Verbal a été généré et mis à jour.",
                    "report": serializer.data
                })
            else:
                # Don't overwrite existing content
                return Response({
                    "message": "Un Procès-Verbal existe déjà pour cette réunion.",
                    "report_id": existing_report.id
                })

        # Create new report
        report = MeetingReport.objects.create(
            meeting=meeting,
            title=title,
            summary=summary,
            created_by=request.user
        )

        serializer = MeetingReportSerializer(report)
        return Response({
            "message": "Le modèle de Procès-Verbal a été généré avec succès.",
            "report": serializer.data
        })


class MeetingAttendeeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing meeting attendees"""
    permission_classes = [permissions.IsAuthenticated, MeetingsPermission]
    serializer_class = MeetingAttendeeSerializer

    def get_queryset(self):
        """Filter attendees by meeting and association"""
        # Log the request params
        print(f"Attendee query params: {self.request.query_params}")
        meeting_id = self.request.query_params.get('meeting')
        print(f"Filtering attendees by meeting_id: {meeting_id}")

        queryset = MeetingAttendee.objects.all()

        # Apply meeting filter if provided
        if meeting_id:
            queryset = queryset.filter(meeting_id=meeting_id)
            # Log the number of attendees
            print(f"Found {queryset.count()} attendees for meeting {meeting_id}")

        # Then apply association filter
        if not self.request.user.is_superuser and self.request.user.association:
            queryset = queryset.filter(
                meeting__association=self.request.user.association
            )

        return queryset





    def respond_with_type(self, request, pk=None, token=None, response_type=None):
        """
        Handle attendee responses via token (for email links)
        """
        try:
            # Parse the token to extract attendee and meeting IDs
            if token and token.startswith('mtg-'):
                # Format is mtg-{attendee_id}-{meeting_id}
                token_parts = token.split('-')
                if len(token_parts) >= 3:
                    meeting_id = token_parts[2]
                    attendee_id = token_parts[1]

                    # Important: Only get attendee that matches BOTH id AND meeting_id
                    attendee = MeetingAttendee.objects.filter(
                        id=attendee_id,
                        meeting_id=meeting_id
                    ).first()

                    if not attendee:
                        return Response(
                            {"error": f"No attendee found with ID {attendee_id} for meeting {meeting_id}"},
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    return Response(
                        {"error": "Invalid token format"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # If not using token format, ensure pk is used with the meeting ID from the token
                if not token:
                    return Response(
                        {"error": "Token is required for response validation"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # For backward compatibility - but this branch should rarely be used
                # Get the attendee by pk but verify against token
                attendee = self.get_object()

            # Verify the token is valid for this attendee
            expected_token = f"mtg-{attendee.id}-{attendee.meeting.id}"

            if token != expected_token:
                print(f"DEBUG: Token validation failed. Expected: {expected_token}, Got: {token}")
                return Response(
                    {"error": "Invalid or expired token"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # If direct response type is provided in the URL (yes/no/maybe),
            # automatically process that response
            if request.method == 'GET' and response_type:
                # Map response_type to attendee status
                status_mapping = {
                    'yes': 'present',
                    'no': 'absent',
                    'maybe': 'undecided'
                }

                if response_type in status_mapping:
                    # Update the attendee status
                    new_status = status_mapping[response_type]
                    print(f"DEBUG: Updating attendee status to: {new_status}")

                    # Save original status for comparison
                    original_status = attendee.status

                    # Update the attendee status - ONLY THIS SPECIFIC ATTENDEE
                    attendee.status = new_status
                    attendee.save()

                    print(f"DEBUG: Status updated from {original_status} to {attendee.status}")

                    # Return success data with updated attendee
                    return Response({
                        'success': True,
                        'message': f"Response '{response_type}' recorded successfully",
                        'attendee': MeetingAttendeeSerializer(attendee).data,
                        'meeting': MeetingSerializer(attendee.meeting).data
                    })

            # For regular GET requests, return meeting and attendee details
            if request.method == 'GET':
                print(f"DEBUG: Returning attendee and meeting data for regular GET request")
                data = {
                    'attendee': MeetingAttendeeSerializer(attendee).data,
                    'meeting': MeetingSerializer(attendee.meeting).data
                }
                return Response(data)

            # Handle POST requests to update attendee status
            elif request.method == 'POST':
                # Update attendee status based on response
                if 'status' not in request.data:
                    return Response(
                        {"error": "Response status is required"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Validate response status
                response_status = request.data['status']
                valid_statuses = ['present', 'absent', 'excused', 'undecided']
                if response_status not in valid_statuses:
                    return Response(
                        {"error": f"Invalid response status. Must be one of: {', '.join(valid_statuses)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Update attendee
                print(f"DEBUG: POST - Updating attendee status to: {response_status}")
                attendee.status = response_status

                # Update notes if provided
                if 'notes' in request.data:
                    attendee.notes = request.data['notes']

                # Update attendance mode if provided
                if 'attendance_mode' in request.data:
                    valid_modes = ['in_person', 'virtual', 'undecided']
                    mode = request.data['attendance_mode']
                    if mode in valid_modes:
                        attendee.attendance_mode = mode

                # Save the changes - THIS WILL ONLY AFFECT THE SPECIFIC MEETING ATTENDEE
                attendee.save()
                print(f"DEBUG: Status after update: {attendee.status}")

                # Return updated attendee
                return Response(
                    MeetingAttendeeSerializer(attendee).data,
                    status=status.HTTP_200_OK
                )

        except Exception as e:
            print(f"DEBUG: Error in respond_with_type: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "An error occurred processing your response. Details: " + str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MeetingReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing meeting reports"""
    permission_classes = [permissions.IsAuthenticated, MeetingsPermission]
    serializer_class = MeetingReportSerializer

    def get_queryset(self):
        """Filter reports by meeting and association"""
        queryset = MeetingReport.objects.all()

        # Apply meeting filter if provided
        meeting_id = self.request.query_params.get('meeting')
        if meeting_id:
            queryset = queryset.filter(meeting_id=meeting_id)
            print(f"Filtering reports by meeting_id: {meeting_id}")
            print(f"Found {queryset.count()} reports for meeting {meeting_id}")

        # Then apply association filter
        if not self.request.user.is_superuser and self.request.user.association:
            queryset = queryset.filter(
                meeting__association=self.request.user.association
            )

        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a meeting report"""
        report = self.get_object()

        # Check if user has permission to approve reports
        if not has_permission(request.user, 'meetings', 'edit'):
            return Response(
                {"error": "You don't have permission to approve reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update approval status
        report.is_approved = True
        report.approved_by = request.user
        report.approval_date = timezone.now()
        report.save()

        return Response(
            MeetingReportSerializer(report).data,
            status=status.HTTP_200_OK
        )


class MeetingNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving meeting notifications"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MeetingNotificationSerializer

    def get_queryset(self):
        """Get notifications for the current user"""
        return MeetingNotification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()

        # Update read status
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()

        return Response(
            MeetingNotificationSerializer(notification).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        # Get unread notifications for this user
        unread_notifications = MeetingNotification.objects.filter(
            user=request.user,
            is_read=False
        )

        # Mark all as read
        now = timezone.now()
        count = unread_notifications.update(is_read=True, read_at=now)

        return Response({
            "marked_read": count
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def respond_to_invitation(self, request, pk=None):
        """Handle attendee responses to meeting invitations"""
        meeting = self.get_object()

        # Validate data
        if 'attendee_id' not in request.data:
            return Response(
                {"error": "Attendee ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if 'response_status' not in request.data:
            return Response(
                {"error": "Response status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate response status
        response_status = request.data['response_status']
        if response_status not in ['present', 'absent', 'excused']:
            return Response(
                {"error": "Invalid response status. Must be 'present', 'absent', or 'excused'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the attendee
        try:
            attendee = MeetingAttendee.objects.get(
                id=request.data['attendee_id'],
                meeting=meeting
            )
        except MeetingAttendee.DoesNotExist:
            return Response(
                {"error": "Attendee not found for this meeting"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update attendee status
        attendee.status = response_status

        # Update notes if provided
        if 'notes' in request.data:
            attendee.notes = request.data['notes']

        attendee.save()

        # Return updated attendee
        return Response(
            MeetingAttendeeSerializer(attendee).data,
            status=status.HTTP_200_OK
        )