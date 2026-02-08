from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from datetime import datetime
import redis
import json

from .serializers import *
from .models import *
from users.permissions import ProjectsPermission, MembersPermission


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_websocket_connection(request):
    """
    Debug endpoint to test WebSocket connection components
    """
    result = {
        "redis_connection": test_redis_connection(),
        "token_info": get_token_info(request),
        "channel_layers": test_channel_layers(),
    }
    return Response(result)


def test_redis_connection():
    """Test Redis connection"""
    try:
        redis_host = settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0][0]
        redis_port = settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0][1]
        r = redis.Redis(host=redis_host, port=redis_port, db=0, socket_timeout=2)

        if r.ping():
            return {
                "status": "success",
                "message": "Successfully connected to Redis",
                "redis_info": {
                    "version": r.info().get('redis_version', 'unknown'),
                    "clients_connected": r.info().get('connected_clients', 0),
                    "used_memory": r.info().get('used_memory_human', 'unknown')
                }
            }
        else:
            return {"status": "error", "message": "Redis PING failed"}
    except Exception as e:
        return {"status": "error", "message": f"Redis connection failed: {str(e)}"}


def get_token_info(request):
    """Get information about the token being used"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    token_info = {
        "auth_header_present": bool(auth_header),
        "auth_header_format": None,
    }

    if auth_header:
        if auth_header.startswith('Token '):
            token_info["auth_header_format"] = "Token"
            token = auth_header[6:]
        elif auth_header.startswith('Bearer '):
            token_info["auth_header_format"] = "Bearer"
            token = auth_header[7:]
        else:
            token_info["auth_header_format"] = "Unknown"
            token = auth_header

        token_info["token_length"] = len(token)
        token_info["token_preview"] = token[:10] + "..." if len(token) > 10 else token

        from knox.models import AuthToken
        knox_token_exists = AuthToken.objects.filter(token_key=token[:8]).exists()
        token_info["knox_token_found"] = knox_token_exists

        user_id = request.user.id if request.user.is_authenticated else None
        token_info["user_authenticated"] = request.user.is_authenticated
        token_info["user_id"] = user_id

    return token_info


def test_channel_layers():
    """Test if channel layers are configured correctly"""
    try:
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        return {
            "status": "success",
            "channel_layer_type": channel_layer.__class__.__name__,
            "capacity": settings.CHANNEL_LAYERS['default']['CONFIG'].get('capacity', 100),
            "config": settings.CHANNEL_LAYERS['default']['CONFIG']
        }
    except Exception as e:
        return {"status": "error", "message": f"Channel layers test failed: {str(e)}"}


class ProjectViewset(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        """Get projects for the current user's association only"""
        if self.request.user.is_superuser:
            return Project.objects.all()
        if self.request.user.association:
            return Project.objects.filter(association=self.request.user.association)
        return Project.objects.none()

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            if request.user.association:
                serializer.save(association=request.user.association)
            else:
                serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        project = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(project)
        return Response(serializer.data)

    def update(self, request, pk=None):
        queryset = self.get_queryset()
        project = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(project, data=request.data)
        if serializer.is_valid():
            if project.association:
                serializer.save(association=project.association)
            else:
                serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        """Handle PATCH requests for partial updates (e.g., updating progress)"""
        queryset = self.get_queryset()
        project = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(project, data=request.data, partial=True)
        if serializer.is_valid():
            if project.association:
                serializer.save(association=project.association)
            else:
                serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        queryset = self.get_queryset()
        project = get_object_or_404(queryset, pk=pk)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='generate-report')
    def generate_report(self, request, pk=None):
        """
        Generate a project report with PDF
        POST /api/project/{id}/generate-report/
        """
        from fpdf import FPDF
        from django.core.files.base import ContentFile

        queryset = self.get_queryset()
        project = get_object_or_404(queryset, pk=pk)

        meeting_notes = request.data.get('meeting_notes', '')
        summary = request.data.get('summary', f"Rapport pour {project.name}")

        try:
            # Get the current user's member profile
            current_member = Member.objects.filter(
                email=request.user.email,
                association=project.association
            ).first()

            if not current_member:
                return Response(
                    {'error': 'Could not find member profile for report generation'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create PDF with FPDF
            class PDF(FPDF):
                def header(self):
                    self.set_font('Arial', 'B', 16)
                    self.set_text_color(25, 118, 210)
                    self.cell(0, 10, 'Rapport de Projet', 0, 1, 'C')
                    self.ln(5)

                def footer(self):
                    self.set_y(-15)
                    self.set_font('Arial', 'I', 8)
                    self.set_text_color(128, 128, 128)
                    self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

                def chapter_title(self, title):
                    self.set_font('Arial', 'B', 12)
                    self.set_text_color(66, 66, 66)
                    self.cell(0, 10, title, 0, 1, 'L')
                    self.ln(2)

                def chapter_body(self, body):
                    self.set_font('Arial', '', 10)
                    self.set_text_color(0, 0, 0)
                    self.multi_cell(0, 5, body)
                    self.ln()

            # Create PDF instance
            pdf = PDF()
            pdf.add_page()
            pdf.set_auto_page_break(auto=True, margin=15)

            # Title
            pdf.set_font('Arial', 'B', 20)
            pdf.set_text_color(25, 118, 210)
            pdf.cell(0, 10, project.name, 0, 1, 'C')
            pdf.ln(10)

            # Project Information Header
            pdf.set_font('Arial', 'B', 11)
            pdf.set_fill_color(25, 118, 210)
            pdf.set_text_color(255, 255, 255)
            pdf.cell(0, 10, 'Informations du Projet', 0, 1, 'L', True)
            pdf.ln(2)

            # Table data
            pdf.set_font('Arial', '', 10)
            pdf.set_text_color(0, 0, 0)

            table_data = [
                ('Nom du projet', project.name),
                ('Statut', project.status),
                ('Budget', f"{project.budget} TND"),
                ('Date de debut', project.start_date.strftime('%d/%m/%Y') if project.start_date else 'N/A'),
                ('Date de fin', project.end_date.strftime('%d/%m/%Y') if project.end_date else 'N/A'),
                ('Progression', f"{project.progress_percentage or 0}%"),
                ('Responsable', project.responsible.name if project.responsible else 'Non assigne'),
            ]

            for label, value in table_data:
                pdf.set_font('Arial', 'B', 10)
                pdf.cell(60, 8, label + ':', 1, 0, 'L')
                pdf.set_font('Arial', '', 10)
                pdf.cell(0, 8, str(value), 1, 1, 'L')

            pdf.ln(10)

            # Description section
            if project.description:
                pdf.chapter_title('Description du projet')
                pdf.chapter_body(project.description)

            # Summary section
            if summary and summary != f"Rapport pour {project.name}":
                pdf.chapter_title('Resume')
                pdf.chapter_body(summary)

            # Meeting notes section
            if meeting_notes:
                pdf.chapter_title('Notes de reunion')
                pdf.chapter_body(meeting_notes)

            # Generation info
            pdf.ln(10)
            pdf.set_font('Arial', 'I', 9)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 5, f"Rapport genere par: {current_member.name}", 0, 1, 'L')
            pdf.cell(0, 5, f"Date de generation: {timezone.now().strftime('%d/%m/%Y a %H:%M')}", 0, 1, 'L')

            # ✅ FIXED: Generate PDF content correctly
            pdf_content = bytes(pdf.output())

            # Verify PDF was created
            if len(pdf_content) < 100:
                raise Exception("PDF generation failed - file too small")

            # Create the report object
            report = ProjectReport.objects.create(
                project=project,
                generated_by=current_member,
                meeting_notes=meeting_notes,
                summary=summary,
                is_final_report=False
            )

            # Save PDF to the report
            filename = f"rapport_{project.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            report.pdf_file.save(filename, ContentFile(pdf_content), save=True)

            serializer = ProjectReportSerializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"PDF Generation Error: {error_details}")
            return Response(
                {'error': f'Error generating report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MemberViewset(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

    def get_queryset(self):
        """Get members for the current user's association only"""
        if self.request.user.is_superuser:
            return Member.objects.all()
        if self.request.user.association:
            return Member.objects.filter(association=self.request.user.association)
        return Member.objects.none()

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        data = request.data.copy()
        if request.user.association:
            data['association'] = request.user.association.id
            serializer = self.serializer_class(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save(needs_profile_completion=data.get('needs_profile_completion', False))
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "You must be associated with an organization to create members"},
            status=status.HTTP_403_FORBIDDEN
        )

    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        member = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(member)
        return Response(serializer.data)

    def update(self, request, pk=None):
        queryset = self.get_queryset()
        member = get_object_or_404(queryset, pk=pk)
        data = request.data.copy()
        data['association'] = member.association.id
        serializer = self.serializer_class(member, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save(
                needs_profile_completion=request.data.get('needs_profile_completion', member.needs_profile_completion)
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        queryset = self.get_queryset()
        member = get_object_or_404(queryset, pk=pk)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# NEW VIEWSETS - Project Management
# ============================================================

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Tasks
    GET /api/tasks/ - List all tasks
    POST /api/tasks/ - Create new task
    GET /api/tasks/{id}/ - Get specific task
    PUT /api/tasks/{id}/ - Update task
    DELETE /api/tasks/{id}/ - Delete task
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.all()
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class ProjectPhaseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Project Phases
    """
    serializer_class = ProjectPhaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProjectPhase.objects.all()
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    @action(detail=True, methods=['post'])
    def validate_phase(self, request, pk=None):
        """Validate a phase"""
        phase = self.get_object()
        member_id = request.data.get('member_id')

        if not member_id:
            return Response({'error': 'member_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

        phase.is_validated = True
        phase.validated_by = member
        phase.validated_at = timezone.now()
        phase.status = 'validated'
        phase.save()

        project = phase.project
        project.calculate_progress()
        project.save()

        serializer = self.get_serializer(phase)
        return Response(serializer.data)


class ProjectReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Project Reports
    """
    serializer_class = ProjectReportSerializer
    permission_classes = [IsAuthenticated]
    queryset = ProjectReport.objects.all()

    def get_queryset(self):
        queryset = ProjectReport.objects.all()
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    @action(detail=False, methods=['get'])
    def project_progress(self, request):
        """Get project progress details"""
        project_id = request.query_params.get('project_id')

        if not project_id:
            return Response({'error': 'project_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        phase_progress = project.calculate_progress()
        task_progress = project.calculate_task_progress()
        phases = project.phases.all()
        tasks = project.tasks.all()

        progress_data = {
            'project': {'id': project.id, 'name': project.name, 'status': project.status},
            'phase_progress': phase_progress,
            'task_progress': task_progress,
            'average_progress': int((phase_progress + task_progress) / 2),
            'phases': {
                'total': phases.count(),
                'validated': phases.filter(is_validated=True).count(),
                'pending': phases.filter(status='pending').count(),
                'in_progress': phases.filter(status='in_progress').count(),
            },
            'tasks': {
                'total': tasks.count(),
                'done': tasks.filter(status='done').count(),
                'in_progress': tasks.filter(status='in_progress').count(),
                'todo': tasks.filter(status='todo').count(),
                'blocked': tasks.filter(status='blocked').count(),
            },
            'phases_detail': ProjectPhaseSerializer(phases, many=True).data,
            'reports': {
                'total': project.reports.count(),
                'final_reports': project.reports.filter(is_final_report=True).count(),
                'intermediate_reports': project.reports.filter(is_final_report=False).count(),
            }
        }

        return Response(progress_data)