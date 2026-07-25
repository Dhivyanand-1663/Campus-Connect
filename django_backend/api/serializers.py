from rest_framework import serializers
from .models import User, Event, EventActivity, Complaint, ComplaintMessage

class UserSerializer(serializers.ModelSerializer):
    rollNumber = serializers.CharField(source='roll_number', required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'role', 'department', 'rollNumber']

class EventActivitySerializer(serializers.ModelSerializer):
    actorName = serializers.CharField(source='actor_name')
    actorRole = serializers.CharField(source='actor_role')

    class Meta:
        model = EventActivity
        fields = ['id', 'actorName', 'actorRole', 'action', 'remarks', 'timestamp']

class EventSerializer(serializers.ModelSerializer):
    created_by_roll = serializers.CharField(required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    activities = EventActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'venue', 'date', 'status', 'created_by', 'created_by_roll', 'department', 'createdAt', 'activities']

class ComplaintMessageSerializer(serializers.ModelSerializer):
    senderName = serializers.CharField(source='sender_name')
    senderRole = serializers.CharField(source='sender_role')

    class Meta:
        model = ComplaintMessage
        fields = ['id', 'senderName', 'senderRole', 'message', 'timestamp']

class ComplaintSerializer(serializers.ModelSerializer):
    raised_by_roll = serializers.CharField(required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    messages = ComplaintMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = ['id', 'title', 'category', 'description', 'status', 'raised_by', 'raised_by_roll', 'department', 'createdAt', 'messages']
