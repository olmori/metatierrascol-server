#/bin/sh
## This script is used to initialize the database for a Django application.
python manage.py migrate
## Create a superuser if the environment variables are set
DJANGO_SUPERUSER_PASSWORD=${DJANGO_SUPERUSER_PASSWORD} python manage.py createsuperuser --noinput --username ${DJANGO_SUPERUSER_USERNAME} --email ${DJANGO_SUPERUSER_EMAIL}

## Create the database tables from the application models
python manage.py makemigrations
python manage.py migrate










