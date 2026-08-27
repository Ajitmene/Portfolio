import json
from pathlib import Path

from django.core.management.base import BaseCommand

from projects.models import Certification, Project


class Command(BaseCommand):
    help = "One-time import of data/projects.json and data/certifications.json into the database."

    def handle(self, *args, **options):
        root = Path(__file__).resolve().parents[5]  # backend/projects/management/commands/ -> project root
        projects_path = root / "data" / "projects.json"
        certs_path = root / "data" / "certifications.json"

        if projects_path.exists():
            data = json.loads(projects_path.read_text())
            created = 0
            for item in data:
                _, was_created = Project.objects.update_or_create(
                    title=item["title"],
                    defaults={
                        "short_description": item.get("shortDescription", ""),
                        "problem": item.get("problem", ""),
                        "solution": item.get("solution", ""),
                        "category": item.get("category", ""),
                        "technologies": item.get("technologies", []),
                        "features": item.get("features", []),
                        "metrics": item.get("metrics", []),
                        "image": item.get("image", ""),
                        "github": item.get("github", ""),
                        "live_demo": item.get("liveDemo", ""),
                        "featured": item.get("featured", False),
                        "status": item.get("status", "Completed"),
                        "date": item.get("date", ""),
                        "order": item.get("order", 0),
                    },
                )
                created += was_created
            self.stdout.write(self.style.SUCCESS(f"Projects: {created} created, {len(data) - created} updated."))
        else:
            self.stdout.write(self.style.WARNING(f"No projects.json found at {projects_path}"))

        if certs_path.exists():
            certs = json.loads(certs_path.read_text())
            for c in certs:
                Certification.objects.update_or_create(
                    name=c["name"],
                    organization=c["organization"],
                    defaults={"date": c.get("date", ""), "link": c.get("link", ""), "order": c.get("id", 0)},
                )
            self.stdout.write(self.style.SUCCESS(f"Certifications: {len(certs)} imported."))
        else:
            self.stdout.write(self.style.WARNING(f"No certifications.json found at {certs_path}"))
