from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@method_decorator(never_cache, name="dispatch")
class DebugIPView(APIView):
    """TEMPORARY — remove after B1 network testing is done."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []  # don't let this itself get throttled or skew buckets

    def get(self, request):
        return Response({
            "REMOTE_ADDR": request.META.get("REMOTE_ADDR"),
            "HTTP_X_FORWARDED_FOR": request.META.get("HTTP_X_FORWARDED_FOR"),
            "HTTP_CF_CONNECTING_IP": request.META.get("HTTP_CF_CONNECTING_IP"),
            "HTTP_X_REAL_IP": request.META.get("HTTP_X_REAL_IP"),
            "HTTP_TRUE_CLIENT_IP": request.META.get("HTTP_TRUE_CLIENT_IP"),
        })