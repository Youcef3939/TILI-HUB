from django.contrib import admin
from .models import Document, DocumentChunk, Conversation, Message


class DocumentChunkInline(admin.TabularInline):
    model = DocumentChunk
    extra = 0
    readonly_fields = ('chunk_id', 'content')
    fields = ('chunk_id', 'content')
    can_delete = False
    max_num = 10


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'language', 'created_at', 'chunk_count')
    search_fields = ('title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [DocumentChunkInline]

    def chunk_count(self, obj):
        return obj.chunks.count()

    chunk_count.short_description = 'Number of Chunks'


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('role', 'content', 'created_at')
    fields = ('role', 'content', 'created_at')
    can_delete = False
    max_num = 20


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'updated_at', 'is_active', 'message_count')
    search_fields = ('title', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    inlines = [MessageInline]

    def message_count(self, obj):
        return obj.messages.count()

    message_count.short_description = 'Number of Messages'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'role', 'content_preview', 'conversation', 'created_at')
    search_fields = ('content', 'conversation__title')
    readonly_fields = ('created_at',)
    list_filter = ('role', 'created_at')

    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content

    content_preview.short_description = 'Content'