from django.db import models

class User(models.Model):
    username = models.CharField(max_length=100, primary_key=True)
    password_hash = models.TextField()
    role = models.CharField(max_length=50)
    department = models.CharField(max_length=100, null=True, blank=True)
    roll_number = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'users'
        managed = False

class Event(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    venue = models.CharField(max_length=255)
    date = models.CharField(max_length=50)
    status = models.CharField(max_length=50)
    created_by = models.CharField(max_length=100)
    created_by_roll = models.CharField(max_length=50, null=True, blank=True)
    department = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'events'
        managed = False

class EventActivity(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, db_column='event_id', related_name='activities')
    actor_name = models.CharField(max_length=100)
    actor_role = models.CharField(max_length=50)
    action = models.CharField(max_length=20)
    remarks = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'event_activities'
        managed = False

class Complaint(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    description = models.TextField()
    status = models.CharField(max_length=50)
    raised_by = models.CharField(max_length=100)
    raised_by_roll = models.CharField(max_length=50, null=True, blank=True)
    department = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaints'
        managed = False

class ComplaintMessage(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, db_column='complaint_id', related_name='messages')
    sender_name = models.CharField(max_length=100)
    sender_role = models.CharField(max_length=50)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaint_messages'
        managed = False
