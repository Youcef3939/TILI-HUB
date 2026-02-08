from pathlib import Path
import os
from dotenv import load_dotenv
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-b_*n(q%r99nr9ta^0za2y_2tfld_arqti1i4)qup1bg2!5vn2f'

DEBUG = True

ALLOWED_HOSTS = []

load_dotenv()

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
    'api',
    'knox', 
    'django_rest_passwordreset',
    'chatbot',
    'finances',
    'meetings',
    'django_filters',
    'notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5178',
    'http://127.0.0.1:5180',

]

AUTH_USER_MODEL = 'users.CustomUser'

AUTHENTICATION_BACKENDS = [
    # 'users.authback.EmailBackend',
    "django.contrib.auth.backends.ModelBackend", # this line fixed my problem
]

ROOT_URLCONF = 'auth.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR/"templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'auth.wsgi.application'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('knox.auth.TokenAuthentication',),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'FORMAT_SUFFIX_KWARG': 'format'
}


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'myorg_db',  # Your database name
        'USER': 'postgres',  # Your PostgreSQL username (default is often 'postgres')
        'PASSWORD': '0000',  # Your PostgreSQL password
        'HOST': 'localhost',  # Or the host where your PostgreSQL server runs
        'PORT': '5432',  # Default PostgreSQL port
    }
}

MEDIA_URL = '/media/'  # The URL to access media files
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')  # The folder where media files will be stored
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760

TEMP_DIR = os.path.join(MEDIA_ROOT, 'temp')
os.makedirs(TEMP_DIR, exist_ok=True)

FINANCE_UPLOAD_DIR = os.path.join(MEDIA_ROOT, 'finance')
os.makedirs(os.path.join(FINANCE_UPLOAD_DIR, 'reports'), exist_ok=True)
os.makedirs(os.path.join(FINANCE_UPLOAD_DIR, 'transactions'), exist_ok=True)

MEETINGS_UPLOAD_DIR = os.path.join(MEDIA_ROOT, 'meetings')
os.makedirs(os.path.join(MEETINGS_UPLOAD_DIR, 'agenda'), exist_ok=True)
os.makedirs(os.path.join(MEETINGS_UPLOAD_DIR, 'minutes'), exist_ok=True)
os.makedirs(os.path.join(MEETINGS_UPLOAD_DIR, 'reports'), exist_ok=True)

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreply.myorg@gmail.com'
EMAIL_HOST_PASSWORD = 'ouht eeez vgiy xvbc'
DEFAULT_FROM_EMAIL = 'MyOrg'

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
