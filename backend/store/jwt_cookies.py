"""Helpers for issuing/clearing the HttpOnly admin JWT cookies.

Cookie names, lifetimes and security attributes are all driven by
settings.py (which itself reads from the environment), so behaviour can
be tuned per-environment without touching this code — see
JWT_AUTH_COOKIE, JWT_REFRESH_COOKIE, JWT_COOKIE_SECURE,
JWT_COOKIE_SAMESITE and JWT_COOKIE_DOMAIN in settings.py.
"""

from django.conf import settings

# The refresh cookie is scoped to the auth endpoints only, so the browser
# never sends it to unrelated API routes (defense in depth — the refresh
# token is the longer-lived, more sensitive credential).
REFRESH_COOKIE_PATH = "/api/auth/"
ACCESS_COOKIE_PATH = "/"


def _cookie_kwargs():
    return {
        "httponly": True,
        "secure": settings.JWT_COOKIE_SECURE,
        "samesite": settings.JWT_COOKIE_SAMESITE,
        "domain": settings.JWT_COOKIE_DOMAIN,
    }


def set_access_cookie(response, access_token):
    max_age = int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        settings.JWT_AUTH_COOKIE,
        str(access_token),
        max_age=max_age,
        path=ACCESS_COOKIE_PATH,
        **_cookie_kwargs(),
    )


def set_refresh_cookie(response, refresh_token):
    max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE,
        str(refresh_token),
        max_age=max_age,
        path=REFRESH_COOKIE_PATH,
        **_cookie_kwargs(),
    )


def set_auth_cookies(response, access_token, refresh_token):
    set_access_cookie(response, access_token)
    set_refresh_cookie(response, refresh_token)


def clear_auth_cookies(response):
    response.delete_cookie(
        settings.JWT_AUTH_COOKIE,
        path=ACCESS_COOKIE_PATH,
        domain=settings.JWT_COOKIE_DOMAIN,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE,
        path=REFRESH_COOKIE_PATH,
        domain=settings.JWT_COOKIE_DOMAIN,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
