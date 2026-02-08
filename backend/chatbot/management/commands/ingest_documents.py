from django.core.management.base import BaseCommand
from chatbot.models import Document
from chatbot.services import get_rag_service
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'ingest documents into RAG system (Qdrant)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--document-id',
            type=int,
            help='Ingest only a specific document by ID',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing collection before ingesting',
        )

    def handle(self, *args, **options):
        rag_service = get_rag_service()

        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing collection...'))
            try:
                rag_service.qdrant_client.delete_collection(
                    collection_name=rag_service.collection_name
                )
                rag_service._ensure_collection_exists()
                self.stdout.write(self.style.SUCCESS('collection cleared'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error clearing collection: {e}'))

        if options['document_id']:
            documents = Document.objects.filter(id=options['document_id'])
            if not documents.exists():
                self.stdout.write(self.style.ERROR(f'Document with ID {options["document_id"]} not found'))
                return
        else:
            documents = Document.objects.all()

        if not documents.exists():
            self.stdout.write(self.style.WARNING('No documents found in database'))
            self.stdout.write('Add documents via Django admin first!')
            return

        self.stdout.write(f'Found {documents.count()} document(s) to ingest...\n')

        success_count = 0
        error_count = 0

        for doc in documents:
            try:
                self.stdout.write(f'Processing: {doc.title}... ', ending='')

                if not doc.content or len(doc.content.strip()) == 0:
                    self.stdout.write(self.style.WARNING('SKIPPED (no content)'))
                    continue

                rag_service.process_and_store_document(
                    document_id=doc.id,
                    title=doc.title,
                    content=doc.content
                )

                self.stdout.write(self.style.SUCCESS('✓ SUCCESS'))
                success_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ ERROR: {str(e)}'))
                logger.error(f'Error ingesting document {doc.id}: {e}', exc_info=True)
                error_count += 1

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS(f'✓ Successfully ingested: {success_count}'))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'✗ Errors: {error_count}'))
        self.stdout.write('=' * 50)

        try:
            collection_info = rag_service.qdrant_client.get_collection(
                collection_name=rag_service.collection_name
            )
            self.stdout.write(f'\nTotal chunks in Qdrant: {collection_info.points_count}')
        except:
            pass