FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь backend (manage.py, backend/, apps/)
COPY . .

# Папки для статики/медиа
RUN mkdir -p /app/staticfiles /app/media

EXPOSE 8080

# Миграции → суперюзер → collectstatic → gunicorn
CMD sh -c "\
  python manage.py migrate --noinput && \
  python manage.py createsu && \
  python manage.py collectstatic --noinput && \
  gunicorn backend.wsgi:application --bind 0.0.0.0:8080 --workers 3"
