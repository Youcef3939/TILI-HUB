import os
import traceback
from django.core.management.base import BaseCommand
from django.conf import settings
from chatbot.utils import extract_text_from_pdf, setup_tfidf_index
from chatbot.models import Document, DocumentChunk


class Command(BaseCommand):
    help = 'Process the policy document without using LLM'

    def add_arguments(self, parser):
        parser.add_argument('--pdf_path', type=str, required=True, help='Path to the PDF file')
        parser.add_argument('--debug', action='store_true', help='Show detailed debug information')

    def handle(self, *args, **options):
        pdf_path = options['pdf_path']
        debug = options.get('debug', False)

        if not os.path.exists(pdf_path):
            self.stdout.write(self.style.ERROR(f"PDF file not found at {pdf_path}"))
            # Check if the directory exists
            dir_path = os.path.dirname(pdf_path)
            if not os.path.exists(dir_path):
                self.stdout.write(self.style.ERROR(f"Directory {dir_path} does not exist"))
                os.makedirs(dir_path, exist_ok=True)
                self.stdout.write(self.style.SUCCESS(f"Created directory {dir_path}"))
            return

        try:
            self.stdout.write("Extracting text from PDF...")
            text = extract_text_from_pdf(pdf_path)

            if debug:
                self.stdout.write(f"Extracted text (first 200 chars): {text[:200]}...")
                self.stdout.write(f"Total text length: {len(text)} characters")

            existing_docs = Document.objects.filter(title="Décret-loi n° 2011-88 du 24 septembre 2011")
            if existing_docs.exists():
                self.stdout.write(self.style.WARNING("Document already exists, deleting it first..."))
                existing_docs.delete()

            self.stdout.write("Creating document entry...")
            document = Document(
                title="Décret-loi n° 2011-88 du 24 septembre 2011",
                content=text[:1000] + "..." if len(text) > 1000 else text,  # Store truncated content
                language='fr'
            )
            document.save()
            self.stdout.write(self.style.SUCCESS(f"Created document with ID: {document.id}"))

            self.stdout.write("Creating chunks...")
            self.fixed_chunking(document, text, debug)

            self.stdout.write("Setting up TF-IDF index...")
            setup_tfidf_index()

            self.stdout.write(self.style.SUCCESS(f"Successfully processed document: {document.title}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error processing document: {e}"))
            if debug:
                self.stdout.write(traceback.format_exc())

    def fixed_chunking(self, document, text, debug=False):
        """Improved fixed-size chunking that won't get into infinite loops"""
        chunk_size = 500
        chunk_overlap = 50
        chunks_created = 0
        total_length = len(text)

        positions = []
        current_pos = 0

        while current_pos < total_length:
            end_pos = min(current_pos + chunk_size, total_length)

            if end_pos < total_length:
                for break_char in ['.', '!', '?', '\n']:
                    break_pos = text.find(break_char, end_pos - 30, end_pos + 30)
                    if break_pos != -1:
                        end_pos = break_pos + 1  # Include the break character
                        break

            positions.append((current_pos, end_pos))

            current_pos = end_pos + 1 if end_pos == current_pos else end_pos

            if current_pos >= total_length:
                break

        for i, (start, end) in enumerate(positions):
            chunk_text = text[start:end].strip()
            if not chunk_text:  # Skip empty chunks
                continue

            chunk_id = f"{document.id}_{i}"

            chunk = DocumentChunk(
                document=document,
                content=chunk_text,
                chunk_id=chunk_id
            )
            chunk.save()
            chunks_created += 1

            if debug and chunks_created % 10 == 0:
                self.stdout.write(f"Created {chunks_created} chunks so far...")

        return chunks_created
