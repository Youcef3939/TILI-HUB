import os
import tempfile
import io
import xlsxwriter
from django.http import HttpResponse, FileResponse
from datetime import datetime, timedelta, date
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Donor, Transaction, BudgetAllocation, FinancialReport
from .serializers import (
    DonorSerializer,
    TransactionSerializer,
    BudgetAllocationSerializer,
    FinancialReportSerializer,
    TransactionVerificationSerializer,
    FinancialStatisticsSerializer
)
from .utils import get_financial_statistics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from decimal import Decimal
from users.AssociationFilterMixin import AssociationFilterMixin
from django.shortcuts import get_object_or_404
from decimal import Decimal
from api.models import Project

from .models import Donor, Transaction, BudgetAllocation, FinancialReport, ForeignDonationReport
from .serializers import (
    ForeignDonationReportSerializer
)

class DonorViewSet(viewsets.ViewSet):
    queryset = Donor.objects.all()
    serializer_class = DonorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'email', 'tax_id']
    filterset_fields = ['is_member', 'is_internal', 'is_anonymous', 'is_active']

    def get_queryset(self):
        """
        Filter donors to only show those associated with the user's association
        - Either directly through the association field
        - Or those that have transactions with projects from the user's association
        """
        # Superusers can see all donors
        if self.request.user.is_superuser:
            queryset = Donor.objects.all()
        # Users with association can only see donors related to their association
        elif hasattr(self.request.user, 'association') and self.request.user.association:
            # Get all project IDs from this association
            association_projects = Project.objects.filter(
                association=self.request.user.association
            ).values_list('id', flat=True)

            # Use Q objects to combine the conditions in a single query
            queryset = Donor.objects.filter(
                Q(association=self.request.user.association) |
                Q(transactions__project__in=association_projects)
            ).distinct()
        else:
            queryset = Donor.objects.none()

        # Apply additional filters from query params
        is_anonymous = self.request.query_params.get('is_anonymous', None)
        if is_anonymous is not None:
            is_anonymous = is_anonymous.lower() == 'true'
            queryset = queryset.filter(is_anonymous=is_anonymous)

        is_member = self.request.query_params.get('is_member', None)
        if is_member is not None:
            is_member = is_member.lower() == 'true'
            queryset = queryset.filter(is_member=is_member)

        is_internal = self.request.query_params.get('is_internal', None)
        if is_internal is not None:
            is_internal = is_internal.lower() == 'true'
            queryset = queryset.filter(is_internal=is_internal)

        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)

        # External donors (neither member nor internal)
        is_external = self.request.query_params.get('is_external', None)
        if is_external is not None:
            is_external = is_external.lower() == 'true'
            if is_external:
                queryset = queryset.filter(is_member=False, is_internal=False)

        return queryset.order_by('-created_at')

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:

                if hasattr(request.user, 'association') and request.user.association:
                    donor = serializer.save(created_by=request.user, association=request.user.association)
                else:
                    donor = serializer.save(created_by=request.user)

                # Log created donor for debugging
                print(f"Created donor: {donor.id} - {donor.name} - Association: {donor.association}")
                print(f"  Member: {donor.is_member}, Internal: {donor.is_internal}, Member ID: {donor.member_id}")

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error creating donor: {str(e)}")
                return Response(
                    {"error": f"Failed to create donor: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        donor = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(donor)
        return Response(serializer.data)

    def update(self, request, pk=None):
        queryset = self.get_queryset()
        donor = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(donor, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        queryset = self.get_queryset()
        donor = get_object_or_404(queryset, pk=pk)
        donor.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def members(self, request):
        """Get all donors who are members"""
        queryset = self.get_queryset().filter(is_member=True)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def internal(self, request):
        """Get all internal donors"""
        queryset = self.get_queryset().filter(is_internal=True)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def external(self, request):
        """Get all external donors (neither members nor internal)"""
        queryset = self.get_queryset().filter(is_member=False, is_internal=False)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'category', 'status', 'project', 'donor']
    search_fields = ['description', 'reference_number']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_queryset(self):
        """Filter transactions by user's association"""
        # Superusers can see all transactions
        if self.request.user.is_superuser:
            queryset = Transaction.objects.all()
        # Users can only see transactions for their association
        elif hasattr(self.request.user, 'association') and self.request.user.association:
            # Get transactions that either:
            # 1. Have the association field set directly to the user's association, OR
            # 2. Have a project associated with the user's association
            queryset = Transaction.objects.filter(
                Q(association=self.request.user.association) |
                Q(project__association=self.request.user.association)
            ).distinct()
        else:
            queryset = Transaction.objects.none()

        # Apply additional filters from query params
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        from django.db import transaction

        # Use transaction.atomic to ensure all operations succeed or fail together
        with transaction.atomic():
            serializer = self.serializer_class(data=request.data, context={'request': request})
            if serializer.is_valid():
                # Add association if applicable
                if hasattr(request.user, 'association') and request.user.association:
                    transaction_obj = serializer.save(association=request.user.association)
                else:
                    transaction_obj = serializer.save()

                # For debugging purposes
                print(
                    f"Created transaction: {transaction_obj.id} - {transaction_obj.amount} - Project: {transaction_obj.project}")
                if hasattr(transaction_obj, 'association'):
                    print(f"Transaction association: {transaction_obj.association}")

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        transaction = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(transaction)
        return Response(serializer.data)



    def update(self, request, pk=None):
        """Update a transaction instance"""
        queryset = self.get_queryset()
        transaction = get_object_or_404(queryset, pk=pk)

        # Use transaction.atomic to ensure all operations succeed or fail together
        from django.db import transaction as db_transaction

        with db_transaction.atomic():
            # Store the initial status for budget calculations
            initial_status = transaction.status
            initial_budget = transaction.budget_allocation

            serializer = self.serializer_class(transaction, data=request.data, context={'request': request})
            if serializer.is_valid():
                # Save the updated transaction
                updated_transaction = serializer.save()

                # For debugging purposes
                print(
                    f"Updated transaction: {updated_transaction.id} - {updated_transaction.amount} - Project: {updated_transaction.project}")

                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            instance.save()
            return instance

    def destroy(self, request, pk=None):
        queryset = self.get_queryset()
        transaction = get_object_or_404(queryset, pk=pk)
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Endpoint for verifying a transaction"""
        queryset = self.get_queryset()
        transaction = get_object_or_404(queryset, pk=pk)
        serializer = TransactionVerificationSerializer(
            transaction,
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            # Return the full transaction data
            return Response(
                TransactionSerializer(transaction, context={'request': request}).data
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def download_document(self, request, pk=None):
        """Download the transaction document"""
        queryset = self.get_queryset()
        transaction = get_object_or_404(queryset, pk=pk)

        if not transaction.document:
            return Response(
                {"error": "No document available for download"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Check if file exists
            if not transaction.document.storage.exists(transaction.document.name):
                return Response(
                    {"error": "Document file not found on server"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get the file path
            file_path = transaction.document.path

            # Return file directly using FileResponse
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/octet-stream'
            )

            # Set filename for download
            filename = os.path.basename(transaction.document.name)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            return response

        except Exception as e:
            print(f"Error downloading transaction document: {str(e)}")
            return Response(
                {"error": f"Error downloading file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export transactions as Excel file"""
        # Get filtered queryset
        queryset = self.filter_queryset(self.get_queryset())

        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            # Create Excel file
            workbook = xlsxwriter.Workbook(tmp.name)
            worksheet = workbook.add_worksheet('Transactions')

            # Define header format
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#F0F0F0',
                'border': 1
            })

            # Define cell format
            cell_format = workbook.add_format({
                'border': 1
            })

            # Define date format
            date_format = workbook.add_format({
                'border': 1,
                'num_format': 'yyyy-mm-dd'
            })

            # Define amount format
            amount_format = workbook.add_format({
                'border': 1,
                'num_format': '#,##0.00'
            })

            # Define headers
            headers = [
                'ID', 'Type', 'Category', 'Amount', 'Description', 'Date',
                'Project', 'Donor', 'Reference', 'Status', 'Created By'
            ]

            # Write headers
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)

            # Write data
            for row, transaction in enumerate(queryset, start=1):
                worksheet.write(row, 0, transaction.id, cell_format)
                worksheet.write(row, 1, transaction.get_transaction_type_display(), cell_format)
                worksheet.write(row, 2, transaction.get_category_display(), cell_format)
                worksheet.write(row, 3, float(transaction.amount), amount_format)
                worksheet.write(row, 4, transaction.description, cell_format)
                worksheet.write_datetime(row, 5, transaction.date, date_format)
                worksheet.write(row, 6, transaction.project.name if transaction.project else '', cell_format)
                worksheet.write(row, 7, transaction.donor.name if transaction.donor else '', cell_format)
                worksheet.write(row, 8, transaction.reference_number or '', cell_format)
                worksheet.write(row, 9, transaction.get_status_display(), cell_format)
                worksheet.write(row, 10, transaction.created_by.email if transaction.created_by else '', cell_format)

            # Adjust column widths
            for i, header in enumerate(headers):
                worksheet.set_column(i, i, max(15, len(header) + 5))

            workbook.close()

            # Open and read the file
            with open(tmp.name, 'rb') as f:
                file_data = f.read()

            # Clean up the temporary file
            os.unlink(tmp.name)

            # Prepare the response
            response = Response(
                file_data,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename=transactions.xlsx'
            return response

    def filter_queryset(self, queryset):
        """
        Filter the queryset using the filter backends
        (For compatibility with the export action)
        """
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset


class BudgetAllocationViewSet(viewsets.ViewSet):
    queryset = BudgetAllocation.objects.all()
    serializer_class = BudgetAllocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project']
    search_fields = ['project__name', 'notes']
    ordering_fields = ['allocated_amount', 'used_amount', 'created_at']

    def get_queryset(self):
        """Filter budget allocations by user's association"""
        # Superusers can see all budgets
        if self.request.user.is_superuser:
            return BudgetAllocation.objects.all()

        # Users can only see budgets for their association
        if hasattr(self.request.user, 'association') and self.request.user.association:
            return BudgetAllocation.objects.filter(
                Q(association=self.request.user.association) |
                Q(project__association=self.request.user.association)
            ).distinct()

        return BudgetAllocation.objects.none()

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        from django.db import transaction

        with transaction.atomic():
            # Pass the request in the context when instantiating the serializer
            serializer = self.serializer_class(data=request.data, context={'request': request})
            if serializer.is_valid():
                # Add association if applicable
                if hasattr(request.user, 'association') and request.user.association:
                    budget = serializer.save(association=request.user.association)
                else:
                    budget = serializer.save()

                # For debugging purposes
                print(
                    f"Created budget allocation: {budget.id} - Project: {budget.project} - Amount: {budget.allocated_amount}")
                if hasattr(budget, 'association'):
                    print(f"Budget allocation association: {budget.association}")

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        budget = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(budget)
        return Response(serializer.data)

    def update(self, request, pk=None):
        queryset = self.get_queryset()
        budget = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(budget, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        queryset = self.get_queryset()
        budget = get_object_or_404(queryset, pk=pk)
        budget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def adjust_budget(self, request, pk=None):
        """Endpoint for adjusting a project's budget allocation"""
        from django.db import transaction

        with transaction.atomic():
            queryset = self.get_queryset()
            budget = get_object_or_404(queryset, pk=pk)
            new_amount = request.data.get('allocated_amount')

            if not new_amount:
                return Response(
                    {"error": "allocated_amount is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                # Convert to float first for validation
                float_amount = float(new_amount)

                # Then convert to Decimal for storage
                decimal_amount = Decimal(str(new_amount))

            except ValueError:
                return Response(
                    {"error": "allocated_amount must be a number"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if the new budget is less than what's already used
            if float_amount < float(budget.used_amount):
                return Response(
                    {"error": "New budget cannot be less than the amount already used"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Assign the Decimal value, not the float
            budget.allocated_amount = decimal_amount
            budget.save()

            serializer = self.serializer_class(budget)
            return Response(serializer.data)


class ForeignDonationReportViewSet(viewsets.ModelViewSet):
    queryset = ForeignDonationReport.objects.all()
    serializer_class = ForeignDonationReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['report_status', 'report_required']
    search_fields = ['transaction__description', 'transaction__donor__name']
    ordering_fields = ['reporting_deadline', 'created_at']

    def get_queryset(self):
        """Filter reports by user's association"""
        # Superusers can see all reports
        if self.request.user.is_superuser:
            return ForeignDonationReport.objects.all()

        # Users can only see reports for their association
        if hasattr(self.request.user, 'association') and self.request.user.association:
            return ForeignDonationReport.objects.filter(
                Q(transaction__association=self.request.user.association) |
                Q(transaction__project__association=self.request.user.association)
            ).distinct()

        return ForeignDonationReport.objects.none()

    @action(detail=True, methods=['post'])
    def generate_letter(self, request, pk=None):
        """Generate a letter for the foreign donation report with enhanced error handling"""
        import logging
        logger = logging.getLogger(__name__)

        report = self.get_object()

        # Check if transaction exists
        if not report.transaction:
            logger.error(f"Report {pk} has no associated transaction")
            return Response(
                {
                    "status": "error",
                    "message": "Ce rapport n'a pas de transaction associée",
                    "details": {"error": "No transaction found for this report"}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if donor exists in transaction
        if not report.transaction.donor:
            logger.error(f"Transaction {report.transaction.id} has no donor")
            return Response(
                {
                    "status": "error",
                    "message": "La transaction n'a pas de donateur associé",
                    "details": {"error": "No donor found for the transaction"}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            logger.info(f"Starting letter generation for report {pk}")

            # Add transaction verification check
            if report.transaction.status != 'verified':
                logger.warning(f"Transaction {report.transaction.id} is not verified")
                return Response(
                    {
                        "status": "warning",
                        "message": "La transaction n'est pas encore vérifiée. Il est recommandé de vérifier la transaction avant de générer la lettre."
                    },
                    status=status.HTTP_200_OK
                )

            # Try to import reportlab before proceeding
            try:
                from reportlab.lib.pagesizes import A4
            except ImportError:
                logger.error("reportlab library is not installed")
                return Response(
                    {
                        "status": "error",
                        "message": "Bibliothèque de génération PDF manquante sur le serveur",
                        "details": {"error": "reportlab library is not installed on the server"}
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Import utility function
            from .utils import generate_foreign_donation_letter

            # Generate the letter
            report = generate_foreign_donation_letter(report)

            if not report.letter_file:
                logger.error(f"Letter generated but file not saved for report {pk}")
                return Response(
                    {
                        "status": "error",
                        "message": "Lettre générée mais le fichier n'a pas été correctement enregistré",
                        "details": {"error": "Letter file was not saved properly"}
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({
                "status": "success",
                "message": "Lettre générée avec succès",
                "letter_url": report.letter_file.url if report.letter_file else None
            })

        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"Failed to generate letter for report {pk}: {str(e)}")
            logger.error(error_traceback)

            # Add error to report notes
            try:
                report.notes = (report.notes or '') + f"\nErreur lors de la génération (serveur): {str(e)}"
                report.save(update_fields=['notes'])
                logger.info(f"Added error note to report {pk}")
            except Exception as note_error:
                logger.error(f"Failed to add error note to report: {str(note_error)}")

            return Response(
                {
                    "status": "error",
                    "message": f"Erreur lors de la génération de la lettre: {str(e)}",
                    "details": {
                        "error": str(e),
                        "traceback": error_traceback,
                        "path": request.path,
                        "method": request.method,
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def generate_journal_publication(self, request, pk=None):
        """Generate a journal publication text for the foreign donation report with error handling"""
        import logging
        logger = logging.getLogger(__name__)

        report = self.get_object()

        # Check if transaction exists
        if not report.transaction:
            logger.error(f"Report {pk} has no associated transaction")
            return Response(
                {
                    "status": "error",
                    "message": "Ce rapport n'a pas de transaction associée",
                    "details": {"error": "No transaction found for this report"}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if donor exists in transaction
        if not report.transaction.donor:
            logger.error(f"Transaction {report.transaction.id} has no donor")
            return Response(
                {
                    "status": "error",
                    "message": "La transaction n'a pas de donateur associé",
                    "details": {"error": "No donor found for the transaction"}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            logger.info(f"Starting journal publication generation for report {pk}")

            # Add transaction verification check
            if report.transaction.status != 'verified':
                logger.warning(f"Transaction {report.transaction.id} is not verified")
                return Response(
                    {
                        "status": "warning",
                        "message": "La transaction n'est pas encore vérifiée. Il est recommandé de vérifier la transaction avant de générer la publication."
                    },
                    status=status.HTTP_200_OK
                )

            # Import utility function
            from .utils import generate_foreign_donation_journal_publication

            # Generate the journal publication text
            report = generate_foreign_donation_journal_publication(report)

            if not hasattr(report, 'journal_publication_text') or not report.journal_publication_text:
                logger.error(f"Journal publication text not generated for report {pk}")
                return Response(
                    {
                        "status": "error",
                        "message": "Le texte de publication au journal n'a pas été correctement généré",
                        "details": {"error": "Journal publication text was not generated properly"}
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({
                "status": "success",
                "message": "Texte de publication au journal généré avec succès",
                "journal_publication_text": report.journal_publication_text
            })

        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"Failed to generate journal publication for report {pk}: {str(e)}")
            logger.error(error_traceback)

            # Add error to report notes
            try:
                report.notes = (
                                           report.notes or '') + f"\nErreur lors de la génération de la publication (serveur): {str(e)}"
                report.save(update_fields=['notes'])
                logger.info(f"Added error note to report {pk}")
            except Exception as note_error:
                logger.error(f"Failed to add error note to report: {str(note_error)}")

            return Response(
                {
                    "status": "error",
                    "message": f"Erreur lors de la génération de la publication au journal: {str(e)}",
                    "details": {
                        "error": str(e),
                        "traceback": error_traceback,
                        "path": request.path,
                        "method": request.method,
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update the status of the foreign donation report with improved validation"""
        import logging
        logger = logging.getLogger(__name__)

        report = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {"status": "error", "message": "Le statut est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = dict(ForeignDonationReport.REPORT_STATUS_CHOICES)
        if new_status not in valid_statuses:
            return Response(
                {
                    "status": "error",
                    "message": f"Statut invalide. Options valides: {', '.join(valid_statuses.keys())}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Update the status
            report.report_status = new_status

            # If status is 'sent', update sent_date
            if new_status == 'sent' and not report.sent_date:
                from django.utils import timezone
                report.sent_date = timezone.now().date()

            # Save journal publication details if provided
            journal_ref = request.data.get('journal_publication_reference')
            journal_date = request.data.get('journal_publication_date')

            if journal_ref:
                report.journal_publication_reference = journal_ref

            if journal_date:
                try:
                    from datetime import datetime
                    report.journal_publication_date = datetime.strptime(journal_date, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {
                            "status": "error",
                            "message": "Format de date invalide pour journal_publication_date. Utilisez AAAA-MM-JJ."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            report.save()
            logger.info(f"Updated report {pk} status to {new_status}")

            serializer = self.get_serializer(report)
            return Response({
                "status": "success",
                "message": f"Statut mis à jour: {valid_statuses.get(new_status, new_status)}",
                "data": serializer.data
            })

        except Exception as e:
            logger.error(f"Error updating report {pk} status: {str(e)}")
            return Response(
                {
                    "status": "error",
                    "message": f"Erreur lors de la mise à jour du statut: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def download_letter(self, request, pk=None):
        """Download the generated letter with improved error handling"""
        import logging
        logger = logging.getLogger(__name__)

        report = self.get_object()

        if not report.letter_file:
            return Response(
                {
                    "status": "error",
                    "message": "Aucune lettre disponible pour téléchargement"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Check if file exists
            if not report.letter_file.storage.exists(report.letter_file.name):
                logger.error(f"Letter file not found for report {pk}: {report.letter_file.name}")
                return Response(
                    {
                        "status": "error",
                        "message": "Fichier de lettre introuvable sur le serveur"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Return file directly
            file_path = report.letter_file.path
            logger.info(f"Serving letter file for report {pk}: {file_path}")

            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf'
            )

            # Set filename for download
            filename = os.path.basename(report.letter_file.name)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            return response

        except Exception as e:
            logger.error(f"Error downloading letter for report {pk}: {str(e)}")
            return Response(
                {
                    "status": "error",
                    "message": f"Erreur lors du téléchargement: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class FinancialReportViewSet(viewsets.ModelViewSet):
    queryset = FinancialReport.objects.all()
    serializer_class = FinancialReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['report_type', 'status']
    search_fields = ['title']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        """Filter reports by user's association"""
        # Superusers can see all reports
        if self.request.user.is_superuser:
            return FinancialReport.objects.all()

        # Filter reports based on who generated them
        if hasattr(self.request.user, 'association') and self.request.user.association:
            # Only show reports generated by users from the same association
            return FinancialReport.objects.filter(generated_by__association=self.request.user.association)

        return FinancialReport.objects.none()

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        from django.db import transaction

        with transaction.atomic():
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                # Add association if applicable
                if request.user.association:
                    serializer.save(generated_by=request.user, association=request.user.association)
                else:
                    serializer.save(generated_by=request.user)
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=400)

    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        report = get_object_or_404(queryset, pk=pk)
        serializer = self.serializer_class(report)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)  # Add this line to handle the 'partial' parameter
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Endpoint to download the report file directly
        """
        report = self.get_object()

        if not report.report_file:
            return Response(
                {"error": "No report file available for download"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Check if file exists
            if not report.report_file.storage.exists(report.report_file.name):
                return Response(
                    {"error": "Report file not found on server"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get the file content
            file_path = report.report_file.path

            # Return file directly using FileResponse (preferred) or HttpResponse
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )

            # Set filename for download
            filename = os.path.basename(report.report_file.name)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            return response

        except Exception as e:
            print(f"Error downloading report file: {str(e)}")
            return Response(
                {"error": f"Error downloading file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, pk=None):
        queryset = self.get_queryset()
        report = get_object_or_404(queryset, pk=pk)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def generate_report(self, request):
        """Generate a financial report"""
        # Validate input
        report_type = request.data.get('report_type')
        if not report_type:
            return Response(
                {"error": "report_type is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        custom_start_date = request.data.get('start_date')
        custom_end_date = request.data.get('end_date')
        title = request.data.get('title')

        # Determine date range based on report type
        today = timezone.now().date()

        if report_type == 'monthly':
            # Last full month
            end_date = today.replace(day=1) - timedelta(days=1)
            start_date = end_date.replace(day=1)
            if not title:
                title = f"Monthly Report - {start_date.strftime('%B %Y')}"

        elif report_type == 'quarterly':
            # Last full quarter
            current_quarter = (today.month - 1) // 3
            quarter_end_month = current_quarter * 3
            if quarter_end_month == 0:
                quarter_end_month = 12
                end_date = datetime(today.year - 1, quarter_end_month, 31).date()
            else:
                end_date = datetime(today.year, quarter_end_month, 1).date()
                # Get the last day of the month
                if quarter_end_month == 12:
                    end_date = end_date.replace(day=31)
                else:
                    end_date = (datetime(today.year, quarter_end_month + 1, 1).date() - timedelta(days=1))

            start_date = datetime(end_date.year, max(1, quarter_end_month - 2), 1).date()
            if not title:
                quarter = (quarter_end_month // 3)
                title = f"Quarterly Report - Q{quarter} {end_date.year}"

        elif report_type == 'annual':
            # Last full year
            end_date = datetime(today.year - 1, 12, 31).date()
            start_date = datetime(today.year - 1, 1, 1).date()
            if not title:
                title = f"Annual Report - {end_date.year}"

        elif report_type == 'custom':
            # Custom date range
            if not custom_start_date or not custom_end_date:
                return Response(
                    {"error": "start_date and end_date are required for custom reports"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                start_date = datetime.strptime(custom_start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(custom_end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not title:
                title = f"Custom Report - {start_date} to {end_date}"
        else:
            return Response(
                {"error": "Invalid report_type"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the report
        report = FinancialReport.objects.create(
            report_type=report_type,
            title=title,
            start_date=start_date,
            end_date=end_date,
            status='draft',
            generated_by=request.user if request.user.is_authenticated else None,
            notes=request.data.get('notes', '')
        )

        # Generate the report file
        self._generate_report_file(report)

        serializer = self.serializer_class(report)
        return Response(serializer.data)

    def _generate_report_file(self, report):
        """Generate Excel report file with improved error handling and data validation"""
        # Create a temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            tmp_path = tmp.name  # Store the path
            print(f"Creating temporary file at: {tmp_path}")

        try:
            # Use the path in a separate block so the file handle is closed
            workbook = xlsxwriter.Workbook(tmp_path)

            # Add summary worksheet
            print(f"Adding summary worksheet for report: {report.title}")
            self._add_summary_worksheet(workbook, report)

            # Add transactions worksheet
            print(f"Adding transactions worksheet")
            self._add_transactions_worksheet(workbook, report)

            # Add budget utilization worksheet
            print(f"Adding budget worksheet")
            self._add_budget_worksheet(workbook, report)

            # Add donors worksheet
            print(f"Adding donors worksheet")
            self._add_donors_worksheet(workbook, report)

            # Close the workbook to ensure it's written to disk
            workbook.close()
            print(f"Workbook closed successfully")

            # Create a sanitized filename without problematic characters
            safe_title = "".join([c for c in report.title if c.isalpha() or c.isdigit() or c == ' ']).rstrip()
            safe_title = safe_title.replace(' ', '_')
            report_filename = f"{safe_title}.xlsx"

            print(f"Sanitized report filename: {report_filename}")

            # Validate that the temporary file exists and has content
            if not os.path.exists(tmp_path):
                raise FileNotFoundError(f"Temporary file {tmp_path} not found")

            file_size = os.path.getsize(tmp_path)
            if file_size == 0:
                raise ValueError(f"Generated file is empty (0 bytes)")

            print(f"Temporary file exists and has size: {file_size} bytes")

            # Save the file to the report (Django will handle the upload_to path)
            with open(tmp_path, 'rb') as f:
                report_content = f.read()
                # Reset the file field in case it already has a value
                if report.report_file:
                    report.report_file.delete(save=False)
                report.report_file.save(report_filename, io.BytesIO(report_content), save=True)

            # Print debug information
            print(f"Report file saved: {report.report_file.name}")
            if hasattr(report.report_file, 'url'):
                print(f"Report file URL: {report.report_file.url}")
            if hasattr(report.report_file, 'path'):
                print(f"Report file path: {report.report_file.path}")

            return report

        except Exception as e:
            print(f"Error generating report file: {str(e)}")
            import traceback
            traceback.print_exc()
            # Set error status on report
            report.notes = f"{report.notes}\n\nError generating report: {str(e)}"
            report.save()
            raise

        finally:
            # Clean up the temporary file - use try/except to handle if file is still in use
            try:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    print(f"Temporary file {tmp_path} deleted")
                else:
                    print(f"Temporary file {tmp_path} already deleted or not found")
            except PermissionError:
                print(f"Could not delete temporary file {tmp_path} - it will be cleaned up later")
            except Exception as e:
                print(f"Error cleaning up temporary file: {str(e)}")

    def _add_summary_worksheet(self, workbook, report):
        """Add summary worksheet to the report with association filter"""
        worksheet = workbook.add_worksheet('Summary')

        # Get the association for association-specific filtering
        association = None
        if report.generated_by and hasattr(report.generated_by, 'association'):
            association = report.generated_by.association

        # Define formats
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 16,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })

        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#F0F0F0',
            'border': 1
        })

        cell_format = workbook.add_format({
            'border': 1
        })

        amount_format = workbook.add_format({
            'border': 1,
            'num_format': '#,##0.00'
        })

        # Report title
        worksheet.merge_range('A1:F1', report.title, title_format)
        worksheet.write('A2', f"Period: {report.start_date} to {report.end_date}", cell_format)
        worksheet.write('A3', f"Generated by: {report.generated_by.email if report.generated_by else 'System'}",
                        cell_format)
        worksheet.write('A4', f"Generated on: {report.created_at.strftime('%Y-%m-%d %H:%M')}", cell_format)

        # Get summary data with association filter
        transactions_filter = {
            'date__gte': report.start_date,
            'date__lte': report.end_date,
            'status': 'verified'
        }

        # Add association filter if needed
        if association:
            transactions_filter['project__association'] = association

        transactions = Transaction.objects.filter(**transactions_filter)

        total_income = transactions.filter(transaction_type='income').aggregate(
            total=Sum('amount')
        )['total'] or 0

        total_expenses = transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0

        net_balance = total_income - total_expenses

        # Write summary information
        worksheet.write('A6', 'Financial Summary', header_format)
        worksheet.write('A7', 'Total Income:', cell_format)
        worksheet.write('B7', float(total_income), amount_format)
        worksheet.write('A8', 'Total Expenses:', cell_format)
        worksheet.write('B8', float(total_expenses), amount_format)
        worksheet.write('A9', 'Net Balance:', cell_format)
        worksheet.write('B9', float(net_balance), amount_format)

        # Income by category
        worksheet.write('A11', 'Income by Category', header_format)

        row = 12
        for category_tuple in [c for c in Transaction.category.field.choices if c[0] != 'other_expense']:
            category_code = category_tuple[0]
            category_name = category_tuple[1]

            category_total = transactions.filter(
                transaction_type='income',
                category=category_code
            ).aggregate(total=Sum('amount'))['total'] or 0

            worksheet.write(f'A{row}', category_name, cell_format)
            worksheet.write(f'B{row}', float(category_total), amount_format)
            row += 1

        # Expenses by category
        worksheet.write(f'A{row + 1}', 'Expenses by Category', header_format)

        row += 2
        for category_tuple in [c for c in Transaction.category.field.choices if c[0] != 'other_income']:
            category_code = category_tuple[0]
            category_name = category_tuple[1]

            category_total = transactions.filter(
                transaction_type='expense',
                category=category_code
            ).aggregate(total=Sum('amount'))['total'] or 0

            worksheet.write(f'A{row}', category_name, cell_format)
            worksheet.write(f'B{row}', float(category_total), amount_format)
            row += 1

        # Project budget utilization
        row += 2
        worksheet.write(f'A{row}', 'Project Budget Utilization', header_format)
        worksheet.write(f'A{row + 1}', 'Project', header_format)
        worksheet.write(f'B{row + 1}', 'Budget', header_format)
        worksheet.write(f'C{row + 1}', 'Used', header_format)
        worksheet.write(f'D{row + 1}', 'Remaining', header_format)
        worksheet.write(f'E{row + 1}', 'Utilization %', header_format)

        row += 2

        # Filter budget allocations by association
        budget_query = BudgetAllocation.objects.all()
        if association:
            budget_query = budget_query.filter(project__association=association)

        for budget in budget_query:
            worksheet.write(f'A{row}', budget.project.name, cell_format)
            worksheet.write(f'B{row}', float(budget.allocated_amount), amount_format)
            worksheet.write(f'C{row}', float(budget.used_amount), amount_format)
            worksheet.write(f'D{row}', float(budget.remaining_amount), amount_format)
            worksheet.write(f'E{row}', float(budget.utilization_percentage), amount_format)
            row += 1

        # Auto-adjust column widths
        worksheet.set_column('A:A', 25)
        worksheet.set_column('B:E', 15)

    def _add_transactions_worksheet(self, workbook, report):
        """Add transactions worksheet to the report with association filter"""
        worksheet = workbook.add_worksheet('Transactions')

        # Get the association for association-specific filtering
        association = None
        if report.generated_by and hasattr(report.generated_by, 'association'):
            association = report.generated_by.association

        # Define formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#F0F0F0',
            'border': 1
        })

        cell_format = workbook.add_format({
            'border': 1
        })

        date_format = workbook.add_format({
            'border': 1,
            'num_format': 'yyyy-mm-dd'
        })

        amount_format = workbook.add_format({
            'border': 1,
            'num_format': '#,##0.00'
        })

        # Headers
        headers = [
            'ID', 'Type', 'Category', 'Amount', 'Description', 'Date',
            'Project', 'Donor', 'Reference', 'Status', 'Verified By'
        ]

        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)

        # Get transactions with association filter
        transactions_query = {
            'date__gte': report.start_date,
            'date__lte': report.end_date
        }

        # Add association filter if needed
        if association:
            transactions_query['project__association'] = association

        transactions = Transaction.objects.filter(**transactions_query).order_by('date')

        # Write data
        for row, transaction in enumerate(transactions, start=1):
            worksheet.write(row, 0, transaction.id, cell_format)
            worksheet.write(row, 1, transaction.get_transaction_type_display(), cell_format)
            worksheet.write(row, 2, transaction.get_category_display(), cell_format)
            worksheet.write(row, 3, float(transaction.amount), amount_format)
            worksheet.write(row, 4, transaction.description, cell_format)
            worksheet.write_datetime(row, 5, transaction.date, date_format)
            worksheet.write(row, 6, transaction.project.name if transaction.project else '', cell_format)
            worksheet.write(row, 7, transaction.donor.name if transaction.donor else '', cell_format)
            worksheet.write(row, 8, transaction.reference_number or '', cell_format)
            worksheet.write(row, 9, transaction.get_status_display(), cell_format)
            worksheet.write(row, 10, transaction.verified_by.email if transaction.verified_by else '', cell_format)

        # Adjust column widths
        for i, header in enumerate(headers):
            worksheet.set_column(i, i, max(15, len(header) + 5))

    def _add_budget_worksheet(self, workbook, report):
        """Add budget utilization worksheet to the report with association filter"""
        worksheet = workbook.add_worksheet('Budget Utilization')

        # Get the association for association-specific filtering
        association = None
        if report.generated_by and hasattr(report.generated_by, 'association'):
            association = report.generated_by.association

        # Define formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#F0F0F0',
            'border': 1
        })

        cell_format = workbook.add_format({
            'border': 1
        })

        amount_format = workbook.add_format({
            'border': 1,
            'num_format': '#,##0.00'
        })

        percent_format = workbook.add_format({
            'border': 1,
            'num_format': '0.00%'
        })

        # Headers
        headers = [
            'Project', 'Total Budget', 'Used Amount', 'Remaining Amount', 'Utilization %',
            'Period Expenses', 'Period Budget %'
        ]

        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)

        # Get budgets with association filter
        budget_query = BudgetAllocation.objects.all().select_related('project')
        if association:
            budget_query = budget_query.filter(project__association=association)

        # Write data
        for row, budget in enumerate(budget_query, start=1):
            # Calculate period expenses with association filter
            transaction_filter = {
                'project': budget.project,
                'transaction_type': 'expense',
                'status': 'verified',
                'date__gte': report.start_date,
                'date__lte': report.end_date
            }

            period_expenses = Transaction.objects.filter(**transaction_filter).aggregate(
                total=Sum('amount')
            )['total'] or 0

            # Calculate period budget percentage
            period_budget_pct = (
                    float(period_expenses) / float(budget.allocated_amount)
            ) if budget.allocated_amount > 0 else 0

            worksheet.write(row, 0, budget.project.name, cell_format)
            worksheet.write(row, 1, float(budget.allocated_amount), amount_format)
            worksheet.write(row, 2, float(budget.used_amount), amount_format)
            worksheet.write(row, 3, float(budget.remaining_amount), amount_format)
            worksheet.write(row, 4, float(budget.utilization_percentage) / 100, percent_format)
            worksheet.write(row, 5, float(period_expenses), amount_format)
            worksheet.write(row, 6, period_budget_pct, percent_format)

        # Adjust column widths
        worksheet.set_column('A:A', 30)
        worksheet.set_column('B:G', 15)

    def _add_donors_worksheet(self, workbook, report):
        """Add donors worksheet to the report with association filter"""
        worksheet = workbook.add_worksheet('Donors')

        # Get the association for association-specific filtering
        association = None
        if report.generated_by and hasattr(report.generated_by, 'association'):
            association = report.generated_by.association

        # Define formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#F0F0F0',
            'border': 1
        })

        cell_format = workbook.add_format({
            'border': 1
        })

        amount_format = workbook.add_format({
            'border': 1,
            'num_format': '#,##0.00'
        })

        # Headers
        headers = [
            'Donor Name', 'Email', 'Tax ID', 'Total Donations (All Time)',
            'Period Donations', 'Number of Donations'
        ]

        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)

        # Get donors with donations in the period, filtered by association
        donors_query = Donor.objects.all()
        if association:
            # Get all project IDs for this association
            association_projects = Project.objects.filter(
                association=association
            ).values_list('id', flat=True)

            # Filter donors that have transactions with these projects
            donors_query = donors_query.filter(
                transactions__project__in=association_projects
            ).distinct()

        # Write data
        row = 1
        for donor in donors_query:
            # Calculate period donations with association filter
            transactions_filter = {
                'donor': donor,
                'transaction_type': 'income',
                'category': 'donation',
                'status': 'verified',
                'date__gte': report.start_date,
                'date__lte': report.end_date
            }

            # Add association filter if needed
            if association:
                transactions_filter['project__association'] = association

            period_donations = Transaction.objects.filter(**transactions_filter)

            period_total = period_donations.aggregate(total=Sum('amount'))['total'] or 0
            period_count = period_donations.count()

            # Only include donors with activity in the period
            if period_total > 0:
                worksheet.write(row, 0, donor.name if not donor.is_anonymous else "Anonymous Donor", cell_format)
                worksheet.write(row, 1, donor.email or '', cell_format)
                worksheet.write(row, 2, donor.tax_id or '', cell_format)
                worksheet.write(row, 3, float(donor.total_donations), amount_format)
                worksheet.write(row, 4, float(period_total), amount_format)
                worksheet.write(row, 5, period_count, cell_format)
                row += 1

        # Adjust column widths
        worksheet.set_column('A:A', 30)
        worksheet.set_column('B:C', 25)
        worksheet.set_column('D:E', 20)
        worksheet.set_column('F:F', 15)


@action(detail=True, methods=['get'])
def download(self, request, pk=None):
    """
    Endpoint to download the report file directly
    """
    report = self.get_object()

    if not report.report_file:
        return Response(
            {"error": "No report file available for download"},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Open the file
        file_path = report.report_file.path

        if not os.path.exists(file_path):
            return Response(
                {"error": "Report file not found on server"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Read the file content
        with open(file_path, 'rb') as f:
            file_data = f.read()

        # Prepare response with file content
        response = Response(file_data, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        # Set filename for download
        filename = os.path.basename(report.report_file.name)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response

    except Exception as e:
        print(f"Error downloading report file: {str(e)}")
        return Response(
            {"error": f"Error downloading file: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@action(detail=True, methods=['post'])
def finalize(self, request, pk=None):
    """Endpoint to finalize a report (alternative to PATCH)"""
    report = self.get_object()

    if report.status == 'finalized':
        return Response(
            {"message": "Report is already finalized"},
            status=status.HTTP_200_OK
        )

    # Update report status to finalized
    report.status = 'finalized'
    report.save()

    serializer = self.get_serializer(report)
    return Response(serializer.data)

class FinancialDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # Get date range from query params or use default (last 30 days)
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date:
            start_date = (timezone.now() - timedelta(days=30)).date()
        if not end_date:
            end_date = timezone.now().date()

        # Filter statistics by association
        association = None
        if not request.user.is_superuser and hasattr(request.user, 'association'):
            association = request.user.association

        # Get financial statistics with association filter
        statistics = get_financial_statistics(start_date, end_date, association)

        # Serialize and return the data
        serializer = FinancialStatisticsSerializer(statistics)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def generate_report(self, request):
        """Generate a financial report with improved date handling and validation"""
        # Validate input
        report_type = request.data.get('report_type')
        if not report_type:
            return Response(
                {"error": "report_type is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        custom_start_date = request.data.get('start_date')
        custom_end_date = request.data.get('end_date')
        title = request.data.get('title')

        print(f"Generating report of type: {report_type}, title: {title}")

        # Determine date range based on report type
        today = timezone.now().date()

        try:
            if report_type == 'monthly':
                # Last full month
                end_date = today.replace(day=1) - timedelta(days=1)
                start_date = end_date.replace(day=1)
                if not title:
                    title = f"Monthly Report - {start_date.strftime('%B %Y')}"

                print(f"Monthly report period: {start_date} to {end_date}")

            elif report_type == 'quarterly':
                # Last full quarter
                current_month = today.month
                current_quarter = (current_month - 1) // 3
                quarter_end_month = current_quarter * 3

                if quarter_end_month == 0:
                    quarter_end_month = 12
                    end_year = today.year - 1
                else:
                    end_year = today.year

                # Get the last day of the quarter's last month
                if quarter_end_month in [3, 5, 8, 10]:
                    last_day = 30
                elif quarter_end_month == 2:
                    # Handle February (including leap years)
                    is_leap = ((end_year % 4 == 0) and (end_year % 100 != 0)) or (end_year % 400 == 0)
                    last_day = 29 if is_leap else 28
                else:
                    last_day = 31

                end_date = date(end_year, quarter_end_month, last_day)

                # Start date is first day of first month of the quarter
                start_month = quarter_end_month - 2
                if start_month <= 0:
                    start_month += 12
                    start_year = end_year - 1
                else:
                    start_year = end_year

                start_date = date(start_year, start_month, 1)

                if not title:
                    quarter = (quarter_end_month // 3)
                    title = f"Quarterly Report - Q{quarter} {end_year}"

                print(f"Quarterly report period: {start_date} to {end_date}")

            elif report_type == 'annual':
                # Last full year
                end_date = date(today.year - 1, 12, 31)
                start_date = date(today.year - 1, 1, 1)
                if not title:
                    title = f"Annual Report - {end_date.year}"

                print(f"Annual report period: {start_date} to {end_date}")

            elif report_type == 'custom':
                # Custom date range
                if not custom_start_date or not custom_end_date:
                    return Response(
                        {"error": "start_date and end_date are required for custom reports"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                try:
                    # Handle both date string formats: YYYY-MM-DD and the frontend date object
                    if isinstance(custom_start_date, str):
                        start_date = datetime.strptime(custom_start_date, '%Y-%m-%d').date()
                    else:
                        # Handle case where date might be a dictionary with date components
                        start_date = date(
                            custom_start_date.get('year', today.year),
                            custom_start_date.get('month', today.month),
                            custom_start_date.get('day', today.day)
                        )

                    if isinstance(custom_end_date, str):
                        end_date = datetime.strptime(custom_end_date, '%Y-%m-%d').date()
                    else:
                        # Handle case where date might be a dictionary with date components
                        end_date = date(
                            custom_end_date.get('year', today.year),
                            custom_end_date.get('month', today.month),
                            custom_end_date.get('day', today.day)
                        )
                except ValueError as e:
                    return Response(
                        {"error": f"Invalid date format: {str(e)}. Use YYYY-MM-DD format."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    return Response(
                        {"error": f"Error processing dates: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if not title:
                    title = f"Custom Report - {start_date} to {end_date}"

                print(f"Custom report period: {start_date} to {end_date}")
            else:
                return Response(
                    {"error": "Invalid report_type. Must be one of: monthly, quarterly, annual, custom"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate that start date is before end date
            if start_date > end_date:
                return Response(
                    {"error": "Start date must be before end date"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create the report
            report = FinancialReport.objects.create(
                report_type=report_type,
                title=title,
                start_date=start_date,
                end_date=end_date,
                status='draft',
                generated_by=request.user if request.user.is_authenticated else None,
                notes=request.data.get('notes', '')
            )

            print(f"Created report object with ID: {report.id}")

            # Generate the report file
            try:
                self._generate_report_file(report)
                print(f"Report file generation completed successfully")
            except Exception as e:
                print(f"Failed to generate report file: {str(e)}")
                # Don't delete the report object, but add error note
                report.notes += f"\nError generating report file: {str(e)}"
                report.save()
                return Response({
                    "error": f"Report created but file generation failed: {str(e)}",
                    "report_id": report.id
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            serializer = self.serializer_class(report)
            return Response(serializer.data)

        except Exception as e:
            print(f"Unexpected error in generate_report: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to generate report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



