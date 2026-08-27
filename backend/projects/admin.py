from django.contrib import admin

from .models import Certification, ContactMessage, Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "featured", "order")
    list_filter = ("category", "status", "featured")
    search_fields = ("title", "short_description")
    ordering = ("order",)


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "date", "order")
    ordering = ("order",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "created_at", "is_read")
    list_filter = ("is_read",)
    readonly_fields = ("created_at",)
