from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.settings import api_settings
from django.shortcuts import get_object_or_404
import logging
from .models import Conversation, Message, Document, FeedbackLog, ChatbotSettings
from .serializers import ConversationSerializer, ConversationListSerializer, ChatMessageSerializer, DocumentSerializer
from .services import ChatbotService, detect_language
from .conversation_handlers import conversation_manager

logger = logging.getLogger(__name__)

chatbot_service = ChatbotService()


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [AllowAny]

    @property
    def settings(self):
        return api_settings

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Conversation.objects.filter(user=self.request.user).order_by('-updated_at')
        else:
            return Conversation.objects.filter(user=None).order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return self.serializer_class

    def create(self, request, *args, **kwargs):
        conversation = Conversation.objects.create(
            title="New Conversation",
            user=self.request.user if self.request.user.is_authenticated else None
        )
        return Response(self.get_serializer(conversation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        conversation = self.get_object()

        serializer = ChatMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data['message']

        response = chatbot_service.process_message(conversation, user_message)

        conversation.save()

        return Response(response)

    # NEW: History endpoint
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get all messages in this conversation"""
        conversation = self.get_object()

        messages = conversation.messages.all().order_by('created_at')

        messages_data = []
        for msg in messages:
            messages_data.append({
                'id': msg.id,
                'role': msg.role,
                'content': msg.content,
                'created_at': msg.created_at.isoformat(),
            })

        return Response({
            'conversation_id': conversation.id,
            'title': conversation.title,
            'messages': messages_data,
            'total_messages': len(messages_data)
        })

    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Submit feedback for a message"""
        message_id = request.data.get('message_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not message_id or not rating or rating not in range(1, 6):
            return Response(
                {"error": "Valid message_id and rating (1-5) are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            message = Message.objects.get(id=message_id, conversation_id=pk)

            FeedbackLog.objects.create(
                message=message,
                rating=rating,
                comment=comment
            )

            return Response({"status": "Feedback recorded"})

        except Message.DoesNotExist:
            return Response(
                {"error": "Message not found in this conversation"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def get_chatbot_settings(self, request):
        settings = ChatbotSettings.get_settings()
        return Response({
            "name": settings.name,
            "greeting": settings.greeting_message,
            "farewell": settings.farewell_message,
        })


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    @property
    def settings(self):
        return api_settings

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        document = self.get_object()

        if not document.file:
            return Response(
                {"error": "No file attached to this document"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from .utils import process_policy_document
            result = process_policy_document(document.file.path)
            return Response({
                "status": "success",
                "chunks_created": result.chunks.count() if hasattr(result, 'chunks') else 0
            })
        except Exception as e:
            return Response(
                {"error": f"Error processing document: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DirectChatView(views.APIView):
    permission_classes = [AllowAny]

    @property
    def settings(self):
        return api_settings

    def post(self, request):
        try:
            query = request.data.get('message') or request.data.get('query', '')

            if not query or not query.strip():
                return Response(
                    {"error": "No message provided. Please include a 'message' or 'query' field."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            query = query.strip()
            logger.info(f"Direct chat query received: {query[:100]}...")

            # Detect user's language
            user_language = detect_language(query)
            logger.info(f"Detected language: {user_language}")

            try:
                user = request.user if request.user.is_authenticated else None

                conversation = Conversation.objects.create(
                    user=user,
                    title=f'Direct Chat - {query[:50]}',
                    is_active=True
                )
                logger.info(f"Created conversation: {conversation.id}")

            except Exception as e:
                logger.error(f"Error creating conversation: {e}")
                return Response(
                    {'error': 'Could not create conversation'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            try:
                response = chatbot_service.process_message(conversation, query)

                logger.info(f"Response generated successfully")

                return Response({
                    'query': query,
                    'response': response['response'],
                    'sources': response.get('sources', []),
                    'language': response.get('language', user_language),
                    'success': response['success']
                }, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)

                error_msg = {
                    'fr': "Désolé, une erreur s'est produite lors du traitement de votre message.",
                    'en': "Sorry, an error occurred while processing your message.",
                    'ar': "عذراً، حدث خطأ أثناء معالجة رسالتك."
                }

                return Response({
                    'query': query,
                    'response': error_msg.get(user_language, error_msg['fr']),
                    'sources': [],
                    'language': user_language,
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Unexpected error in direct_chat: {e}", exc_info=True)
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )