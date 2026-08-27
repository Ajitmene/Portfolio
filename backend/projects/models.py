from django.db import models


class Project(models.Model):
    STATUS_CHOICES = [
        ("Live", "Live"),
        ("Completed", "Completed"),
        ("In Progress", "In Progress"),
    ]

    title = models.CharField(max_length=200)
    short_description = models.TextField()
    problem = models.TextField(blank=True)
    solution = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    technologies = models.JSONField(default=list, blank=True)
    features = models.JSONField(default=list, blank=True)
    metrics = models.JSONField(default=list, blank=True)  # [{"label": "...", "value": "..."}]
    image = models.CharField(max_length=300, help_text="Path or URL to project screenshot")
    github = models.URLField()
    live_demo = models.URLField(blank=True)
    featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Completed")
    date = models.CharField(max_length=20, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title


class Certification(models.Model):
    name = models.CharField(max_length=200)
    organization = models.CharField(max_length=200)
    date = models.CharField(max_length=50, blank=True)
    link = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.name} — {self.organization}"


class ContactMessage(models.Model):
    """Stores messages submitted through the public contact form."""

    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} — {self.name}"
