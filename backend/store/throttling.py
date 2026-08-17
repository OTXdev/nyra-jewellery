from rest_framework.throttling import ScopedRateThrottle


class CloudflareAwareScopedRateThrottle(ScopedRateThrottle):
    

    def get_ident(self, request):
        cf_ip = request.META.get("HTTP_CF_CONNECTING_IP")
        if cf_ip:
            return cf_ip
        return super().get_ident(request)