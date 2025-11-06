from django.contrib import admin
from .models import Ticket # Correct relative import within its own app

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'movie_title', 'start_time', 'seat_number', 'user', 'id')
    list_filter = ('movie_title', 'start_time', 'user')
    search_fields = ('ticket_number', 'movie_title', 'seat_number', 'user__username')
    raw_id_fields = ('user',)
    date_hierarchy = 'start_time'   