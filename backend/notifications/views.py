from rest_framework import viewsets, status, mixins, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

from .models import Notification, OfficialLetterLog
from .serializers import (
    NotificationSerializer,
    NotificationCreateSerializer,
    OfficialLetterLogSerializer,
    MarkNotificationReadSerializer
)
from .permissions import IsOwnerOrAdmin, CanManageNotifications


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notifications

    list:
    Return a list of all notifications for the current user.

    retrieve:
    Return a specific notification.

    create:
    Create a new notification.

    update:
    Update a notification.

    partial_update:
    Partially update a notification.

    destroy:
    Delete a notification.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        """
        Filter notifications based on user role
        """
        user = self.request.user

        # Base queryset for user's notifications (directed specifically to them)
        user_notifications = Q(recipient=user)

        # Include role-based notifications - check for role as an object
        if hasattr(user, 'role') and user.role:
            role_name = user.role.name
            role_notifications = Q(recipient_role=role_name)

            # Also include notifications where frontend role name is used
            # This handles the case where 'president' is used instead of 'admin'
            if role_name == 'admin':
                frontend_role = 'president'
                role_notifications |= Q(recipient_role=frontend_role)
            elif role_name == 'president':
                backend_role = 'admin'
                role_notifications |= Q(recipient_role=backend_role)
        else:
            # User has no role
            role_notifications = Q()

        # Include "all" notifications (no recipient and no role specified)
        all_notifications = Q(recipient__isnull=True, recipient_role__isnull=True)

        # Superusers and admins can see all notifications
        if user.is_superuser or (hasattr(user, 'role') and user.role and user.role.name in ['admin', 'treasurer', 'president']):
            return Notification.objects.all().order_by('-created_at')

        # Regular members only see their notifications, role-based ones, or "all" notifications
        filtered_notifications = Notification.objects.filter(
            user_notifications | role_notifications | all_notifications
        ).order_by('-created_at')

        return filtered_notifications

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return NotificationCreateSerializer
        elif self.action == 'mark_as_read' or self.action == 'mark_all_as_read':
            return MarkNotificationReadSerializer
        return NotificationSerializer

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response(
            {"status": "success", "message": "Notification marked as read"},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(read=False)
        count = notifications.count()

        # Update all at once for efficiency
        notifications.update(read=True, read_at=timezone.now())

        return Response(
            {"status": "success", "message": f"{count} notifications marked as read"},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(read=False).count()
        return Response({"count": count})

    @action(detail=False, methods=['get'])
    def high_priority(self, request):
        """Get all high priority notifications"""
        notifications = self.get_queryset().filter(priority='high')
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def requires_action(self, request):
        """Get all notifications requiring action"""
        notifications = self.get_queryset().filter(
            requires_action=True,
            action_completed=False
        )
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def requires_letter(self, request):
        """Get all notifications requiring official letters"""
        notifications = self.get_queryset().filter(
            requires_official_letter=True,
            official_letter_sent=False
        )
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_action_completed(self, request, pk=None):
        """Mark a required action as completed"""
        notification = self.get_object()

        if not notification.requires_action:
            return Response(
                {"status": "error", "message": "This notification does not require action"},
                status=status.HTTP_400_BAD_REQUEST
            )

        notification.mark_action_completed()
        return Response(
            {"status": "success", "message": "Action marked as completed"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def mark_letter_sent(self, request, pk=None):
        """Mark an official letter as sent"""
        notification = self.get_object()

        if not notification.requires_official_letter:
            return Response(
                {"status": "error", "message": "This notification does not require an official letter"},
                status=status.HTTP_400_BAD_REQUEST
            )

        notification.mark_letter_sent()
        return Response(
            {"status": "success", "message": "Letter marked as sent"},
            status=status.HTTP_200_OK
        )


class OfficialLetterLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for official letter logs
    """
    serializer_class = OfficialLetterLogSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageNotifications]

    def get_queryset(self):
        """Return all letter logs for admin users, none for regular users"""
        user = self.request.user

        if user.is_superuser or user.role in ['admin', 'treasurer', 'president']:
            return OfficialLetterLog.objects.all().order_by('-date_prepared')

        # Regular users can only see letters they sent
        return OfficialLetterLog.objects.filter(sender=user).order_by('-date_prepared')

    def perform_create(self, serializer):
        """Set sender to current user"""
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_sent(self, request, pk=None):
        """Mark a letter as sent and update related notification"""
        letter_log = self.get_object()

        # Update the letter log
        letter_log.date_sent = timezone.now()
        letter_log.save(update_fields=['date_sent'])

        # Update the related notification
        if letter_log.notification:
            letter_log.notification.mark_letter_sent()

        return Response(
            {"status": "success", "message": "Letter marked as sent"},
            status=status.HTTP_200_OK
        )