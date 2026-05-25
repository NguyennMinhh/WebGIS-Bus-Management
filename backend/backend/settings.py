"""
Django settings — WebGIS BusRouting

Đọc config từ environment variables (inject qua docker-compose hoặc .env local).
Dùng django-environ để parse kiểu dữ liệu (bool, list, int).
"""

from pathlib import Path
import os
import environ

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Đọc .env (chỉ khi chạy local ngoài Docker)
# Trong Docker, env vars được inject trực tiếp qua docker-compose
# ---------------------------------------------------------------------------
env = environ.Env(
    DJANGO_DEBUG=(bool, True),
    DJANGO_ALLOWED_HOSTS=(list, ['*']),
)
env_file = BASE_DIR.parent / '.env'
if env_file.exists():
    environ.Env.read_env(env_file)

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
SECRET_KEY = env('DJANGO_SECRET_KEY', default='django-insecure-local-dev-key-change-me')
DEBUG       = env('DJANGO_DEBUG')
ALLOWED_HOSTS = env('DJANGO_ALLOWED_HOSTS')
GOONG_API_KEY = env('GOONG_API_KEY', default='')

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # GeoDjango — bắt buộc để dùng PostGIS spatial fields
    'django.contrib.gis',

    # Third-party
    'rest_framework',
    'corsheaders',

    # Apps
    'routes',
]

# ---------------------------------------------------------------------------
# Middleware
# CorsMiddleware phải đứng TRƯỚC CommonMiddleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',        # ← CORS trước Common
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ---------------------------------------------------------------------------
# Database — PostgreSQL + PostGIS
# ---------------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME':     env('POSTGRES_DB',       default='busrouting'),
        'USER':     env('POSTGRES_USER',     default='postgres'),
        'PASSWORD': env('POSTGRES_PASSWORD', default='postgres'),
        'HOST':     env('POSTGRES_HOST',     default='localhost'),
        'PORT':     env('POSTGRES_PORT',     default='5432'),
    }
}

# ---------------------------------------------------------------------------
# GeoDjango native libraries — Windows requires explicit DLL paths.
# Also registers the parent folder so dependency DLLs can be found.
# ---------------------------------------------------------------------------
GDAL_LIBRARY_PATH = env('GDAL_LIBRARY_PATH', default=None)
GEOS_LIBRARY_PATH = env('GEOS_LIBRARY_PATH', default=None)

if GDAL_LIBRARY_PATH and os.name == 'nt':
    gdal_bin = str(Path(GDAL_LIBRARY_PATH).parent)
    os.add_dll_directory(gdal_bin)
    os.environ['PATH'] = gdal_bin + os.pathsep + os.environ.get('PATH', '')

# ---------------------------------------------------------------------------
# CORS — cho phép React frontend (port 5173) gọi API
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'vi'
TIME_ZONE     = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ   = True

# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------
STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
