from __future__ import annotations

from django.conf import settings


def frontend_url(request):
    return {"FRONTEND_URL": getattr(settings, "FRONTEND_URL", "")} 
