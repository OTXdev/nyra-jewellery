from datetime import timedelta
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass


def env_bool(name, default=None):
    """
    Strictly parse an environment variable as a boolean.

    Accepts only the intended true/false representations below. Returns
    `default` when the variable is unset. Raises ValueError for any other
    value so callers can fail fast instead of silently misinterpreting input.
    """
    val = os.environ.get(name)
    if val is None:
        return default
    normalized = val.strip().lower()
    if normalized in ("1", "true", "yes", "on"):
        return True
    if normalized in ("0", "false", "no", "off"):
        return False
    raise ValueError(
        f"Environment variable {name!r} must be one of "
        "1/true/yes/on or 0/false/no/off."
    )


def env_list(name, default=""):
    val = os.environ.get(name, default)
    return [item.strip() for item in val.split(",") if item.strip()]


from django.core.exceptions import ImproperlyConfigured 

DJANGO_ENV = os.environ.get("DJANGO_ENV", "development").strip().lower()
IS_DEVELOPMENT = DJANGO_ENV == "development"


if IS_DEVELOPMENT:
    SECRET_KEY = os.environ.get(
        "DJANGO_SECRET_KEY",
        "django-insecure-dev-only-do-not-use-in-production",
    )
else:
    SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
    if not SECRET_KEY:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY is required in a non-development environment."
        )


if IS_DEVELOPMENT:
    DEBUG = env_bool("DJANGO_DEBUG", default=True)
else:
    raw_debug = os.environ.get("DJANGO_DEBUG")
    if raw_debug is None or raw_debug.strip() == "":
        raise ImproperlyConfigured(
            "DJANGO_DEBUG is required in a non-development environment."
        )
    try:
        DEBUG = env_bool("DJANGO_DEBUG")
    except ValueError as exc:
        raise ImproperlyConfigured(str(exc)) from exc

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")


RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)


SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = env_bool(
    "SECURE_SSL_REDIRECT",
    default=not IS_DEVELOPMENT,
)

SESSION_COOKIE_SECURE = env_bool(
    "SESSION_COOKIE_SECURE",
    default=not IS_DEVELOPMENT,
)

CSRF_COOKIE_SECURE = env_bool(
    "CSRF_COOKIE_SECURE",
    default=not IS_DEVELOPMENT,
)

SECURE_HSTS_SECONDS = int(
    os.environ.get(
        "SECURE_HSTS_SECONDS",
        "0" if IS_DEVELOPMENT else "31536000",
    )
)

SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=False)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", default=False)

REDIS_URL = os.environ.get("REDIS_URL")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
        }
    }
# APPLICATIONS
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",

    "corsheaders",
    "django_filters",
    "axes",  
    # Local
    "store",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware", 
]

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",  
    "django.contrib.auth.backends.ModelBackend",
]

AXES_FAILURE_LIMIT = 5            
AXES_COOLOFF_TIME = 1          
AXES_LOCKOUT_PARAMETERS = [["ip_address", "username"]]  
AXES_RESET_ON_SUCCESS = True  


ROOT_URLCONF = "nyra.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "nyra.wsgi.application"
ASGI_APPLICATION = "nyra.asgi.application"


if os.environ.get("DB_ENGINE", "postgres") == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME"),
            "USER": os.environ.get("DB_USER"),
            "PASSWORD": os.environ.get("DB_PASSWORD"),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }

# PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# INTERNATIONALIZATION
LANGUAGE_CODE = "en-us"
TIME_ZONE = os.environ.get("TIME_ZONE", "Africa/Algiers")
USE_I18N = True
USE_TZ = True

# STATIC & MEDIA FILES
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "store.storage.ImageKitStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}



DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DJANGO REST FRAMEWORK
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "store.authentication.CookieJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": int(os.environ.get("PAGE_SIZE", 12)),
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ),
   
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "staff_login": "5/min",
        "order_create": "10/min",
        "contact_create": "10/min",
    },
    "EXCEPTION_HANDLER": "store.exceptions.custom_exception_handler",
}

# SIMPLE JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("JWT_ACCESS_MINUTES", 60))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.environ.get("JWT_REFRESH_DAYS", 7))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# CORS
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOW_CREDENTIALS = True


from corsheaders.defaults import default_headers as _cors_default_headers  # noqa: E402

CORS_ALLOW_HEADERS = list(_cors_default_headers) + ["x-csrftoken"]


JWT_AUTH_COOKIE = os.environ.get("JWT_AUTH_COOKIE", "nyra_access_token")
JWT_REFRESH_COOKIE = os.environ.get("JWT_REFRESH_COOKIE", "nyra_refresh_token")


JWT_COOKIE_SECURE = env_bool("JWT_COOKIE_SECURE", default=not IS_DEVELOPMENT)


JWT_COOKIE_SAMESITE = os.environ.get("JWT_COOKIE_SAMESITE", "Lax")

JWT_COOKIE_DOMAIN = os.environ.get("JWT_COOKIE_DOMAIN") or None

if JWT_COOKIE_SAMESITE.lower() == "none":
    JWT_COOKIE_SECURE = True

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", ",".join(CORS_ALLOWED_ORIGINS))
CSRF_COOKIE_SAMESITE = JWT_COOKIE_SAMESITE
CSRF_COOKIE_HTTPONLY = False  # must stay JS-readable so the frontend can echo it back
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"

DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024