"""
Client-IP resolution for django-axes lockout tracking.

Production topology (verified by live testing against this deployment):

    Browser -> Cloudflare -> Render internal proxy -> Gunicorn/Django

A normal request arrives with exactly 3 comma-separated entries in
X-Forwarded-For:

    "<real_client_ip>, <cloudflare_edge_ip>, <render_internal_proxy_ip>"

Anything a client sends is only ever PREPENDED to the left of this
header -- trusted infrastructure always appends its own hops after
that, confirmed empirically to be un-overridable by the client.
Reading a fixed number of entries from the RIGHT-hand end is therefore
safe no matter how many fake entries an attacker prepends.

If the header has FEWER than 3 entries, we cannot tell a naturally
shortened trusted chain apart from an attacker-shortened one, so this
deliberately does NOT guess by clamping (unlike DRF's own NUM_PROXIES
handling). It fails safe to REMOTE_ADDR instead. REMOTE_ADDR is not
meaningful on this platform (constant across clients), but it is not
attacker-controlled, which is the property that matters here.
"""

TRUSTED_PROXY_DEPTH = 3


def get_axes_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if not xff:
        return request.META.get("REMOTE_ADDR", "")

    addrs = [addr.strip() for addr in xff.split(",") if addr.strip()]

    if len(addrs) < TRUSTED_PROXY_DEPTH:
        return request.META.get("REMOTE_ADDR", "")

    return addrs[-TRUSTED_PROXY_DEPTH]
