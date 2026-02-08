from rest_framework.routers import DefaultRouter
from .views import (
    MemberViewset,
    ProjectViewset,
    TaskViewSet,
    ProjectPhaseViewSet,
    ProjectReportViewSet
)

router = DefaultRouter()
router.register('project', ProjectViewset, basename='project')
router.register('member', MemberViewset, basename='member')

# New project management endpoints
router.register('tasks', TaskViewSet, basename='task')
router.register('phases', ProjectPhaseViewSet, basename='phase')
router.register('reports', ProjectReportViewSet, basename='report')

urlpatterns = router.urls