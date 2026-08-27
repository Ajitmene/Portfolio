from rest_framework import serializers

from .models import Certification, ContactMessage, Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "short_description",
            "problem",
            "solution",
            "category",
            "technologies",
            "features",
            "metrics",
            "image",
            "github",
            "live_demo",
            "featured",
            "status",
            "date",
            "order",
        ]


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "name", "organization", "date", "link", "order"]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_message(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Message is too short.")
        return value
