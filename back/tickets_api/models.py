from django.db import models
from django.contrib.auth.models import User

class Ticket(models.Model):
    ticket_number = models.CharField(max_length=50)
    movie_title = models.CharField(max_length=200)
    start_time = models.DateTimeField()
    seat_number = models.CharField(max_length=10)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')

    def __str__(self):
        return f"{self.ticket_number} - {self.movie_title} ({self.user.username})"
