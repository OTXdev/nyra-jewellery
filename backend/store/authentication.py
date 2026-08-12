"""
Cookie-based JWT authentication for the Nyra admin dashboard.

Why this exists
----------------
SimpleJWT's default `JWTAuthentication` only looks at the `Authorization`
header. We now issue the admin's access token as an HttpOnly cookie so it
can never be read by JavaScript (mitigates XSS token theft). This class:

1. Still accepts `Authorization: Bearer <token>` if present, so any
   existing/non-browser client (Postman, mobile app, CI scripts, etc.)
   keeps working unchanged.
2. Falls back to the `nyra_access_token` HttpOnly cookie when there is no
   Authorization header.
3. When authentication succeeds via the cookie, it enforces Django's CSRF
   protection on unsafe methods (POST/PUT/PATCH/DELETE). This is required
   because browsers attach cookies automatically to cross-site requests,
   which header-based bearer tokens are naturally immune to but
   cookie-based auth is not.
"""

from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework_simplejwt.authentication import JWTAuthentication


def _dummy_get_response(request):
    return None


def enforce_csrf(request):
    """Run Django's CSRF check against the request, mirroring what
    rest_framework.authentication.SessionAuthentication does for
    session-cookie-authenticated requests."""
    check = CSRFCheck(_dummy_get_response)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")


class CookieJWTAuthentication(JWTAuthentication):
    """JWTAuthentication that also accepts the access token from an
    HttpOnly cookie, with CSRF enforcement when it does so."""

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token

        raw_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        enforce_csrf(request)
        return self.get_user(validated_token), validated_token
