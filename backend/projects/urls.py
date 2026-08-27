from rest_framework.routers import DefaultRouter

from django.urls import include, path

from .views import CertificationViewSet, ContactMessageView, ProjectViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")
router.register("certifications", CertificationViewSet, basename="certification")

urlpatterns = [
    path("", include(router.urls)),
    path("contact/", ContactMessageView.as_view(), name="contact-messages"),
]
