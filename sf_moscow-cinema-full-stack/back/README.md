Cinema backend (Django)
----------------------

Structure:
- backend/ (Django settings and wsgi)
- users_api/ (registration + JWT)
- tickets_api/ (Ticket model and API)
- manage.py, requirements.txt, render.yaml, Dockerfile

How to run locally:
1) python -m venv venv
2) source venv/bin/activate (or venv\Scripts\activate on Windows)
3) pip install -r requirements.txt
4) python manage.py migrate
5) python manage.py createsu
6) python manage.py runserver

API endpoints:
- POST /api/users/register/  (username, password, email)
- POST /api/users/token/     (username, password)
- POST /api/users/token/refresh/ (refresh)
- GET/POST /api/tickets/     (auth required)
