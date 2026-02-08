from django.db import models
from django.utils import timezone


class Document(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)  # Store full text or summary
    file = models.FileField(upload_to='documents/', blank=True, null=True)
    language = models.CharField(max_length=10, default='fr')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()
    chunk_id = models.CharField(max_length=200, unique=True)
    embedding = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_id}"


class Conversation(models.Model):
    title = models.CharField(max_length=255, default="New Conversation")
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, null=True, blank=True,
                             related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.created_at.strftime('%Y-%m-%d')})"


class Message(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    )

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    relevant_document_chunks = models.ManyToManyField(DocumentChunk, blank=True, related_name='messages')

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class ChatbotSettings(models.Model):
    name = models.CharField(max_length=100, default="Association Law Assistant")
    greeting_message = models.TextField(
        default="Bonjour! Je suis votre assistant spécialisé dans la législation tunisienne sur les associations. Comment puis-je vous aider aujourd'hui?")
    farewell_message = models.TextField(
        default="Merci d'avoir utilisé mon service. N'hésitez pas à revenir si vous avez d'autres questions!")

    model_path = models.CharField(max_length=255, default="mistral-7b-instruct-v0.1.Q4_K_M.gguf")
    temperature = models.FloatField(default=0.7)
    max_tokens = models.IntegerField(default=256)

    memory_window = models.IntegerField(default=5)

    enable_conversation_enhancements = models.BooleanField(default=True)
    enable_context_aware_responses = models.BooleanField(default=True)
    enable_fallback_responses = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Chatbot Settings"
        verbose_name_plural = "Chatbot Settings"

    def __str__(self):
        return f"Chatbot Configuration (Last updated: {self.updated_at.strftime('%Y-%m-%d')})"

    @classmethod
    def get_settings(cls):
        settings, created = cls.objects.get_or_create(pk=1)
        return settings


class FeedbackLog(models.Model):
    RATING_CHOICES = (
        (1, 'Poor'),
        (2, 'Fair'),
        (3, 'Good'),
        (4, 'Very Good'),
        (5, 'Excellent'),
    )

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='feedback')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback on message {self.message.id}: {self.get_rating_display()}"