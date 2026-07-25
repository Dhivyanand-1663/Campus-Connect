import hashlib
import json
import hmac
import base64
import random
import string
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User, Event, EventActivity, Complaint, ComplaintMessage
from .serializers import UserSerializer, EventSerializer, ComplaintSerializer

TOKEN_SECRET = 'college-portal-super-secret-key-2026'

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def generate_token(user) -> str:
    payload = {
        'username': user.username,
        'role': user.role,
        'department': user.department,
        'createdAt': datetime.now().isoformat()
    }
    payload_b64 = base64.b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8')
    signature = hmac.new(TOKEN_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def verify_token(token: str):
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hmac.new(TOKEN_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if signature != expected_sig:
            return None
        payload_str = base64.b64decode(payload_b64).decode('utf-8')
        return json.loads(payload_str)
    except Exception:
        return None

def authenticate_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    session_data = verify_token(token)
    if not session_data:
        return None
    try:
        return User.objects.get(username__iexact=session_data['username'])
    except User.DoesNotExist:
        return None

@api_view(['POST'])
def register_view(request):
    data = request.data
    username = data.get('username', '').strip()
    password = data.get('password', '')
    role = data.get('role', '')
    department = data.get('department')
    roll_number = data.get('rollNumber')

    if not username or not password or not role:
        return Response({'error': 'Username, password, and role are required fields.'}, status=status.HTTP_400_BAD_REQUEST)

    if role in ['Student', 'Dept Staff', 'HOD'] and not department:
        return Response({'error': 'Department selection is mandatory for this role.'}, status=status.HTTP_400_BAD_REQUEST)

    if role == 'Student' and not roll_number:
        return Response({'error': 'Roll number is mandatory for students.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username__iexact=username).exists():
        return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    pwd_hash = hash_password(password)
    user = User.objects.create(
        username=username,
        password_hash=pwd_hash,
        role=role,
        department=department if role in ['Student', 'Dept Staff', 'HOD'] else None,
        roll_number=roll_number if role == 'Student' else None
    )

    token = generate_token(user)
    return Response({
        'user': UserSerializer(user).data,
        'token': token
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username__iexact=username)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials. User does not exist.'}, status=status.HTTP_401_UNAUTHORIZED)

    if user.password_hash != hash_password(password):
        return Response({'error': 'Invalid credentials. Incorrect password.'}, status=status.HTTP_401_UNAUTHORIZED)

    token = generate_token(user)
    return Response({
        'user': UserSerializer(user).data,
        'token': token
    })

@api_view(['GET'])
def me_view(request):
    user = authenticate_user(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({'user': UserSerializer(user).data})

@api_view(['GET', 'POST'])
def events_view(request):
    user = authenticate_user(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        if user.role == 'Student':
            qs = Event.objects.filter(created_by=user.username)
        elif user.role in ['Dept Staff', 'HOD']:
            qs = Event.objects.filter(department=user.department)
        else:
            qs = Event.objects.all()
        qs = qs.order_by('-created_at')
        return Response(EventSerializer(qs, many=True).data)

    elif request.method == 'POST':
        if user.role != 'Student':
            return Response({'error': 'Only students can create event proposals.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title')
        description = request.data.get('description')
        venue = request.data.get('venue')
        date = request.data.get('date')

        if not title or not description or not venue or not date:
            return Response({'error': 'Title, description, venue, and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        evt_id = 'evt-' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))
        evt = Event.objects.create(
            id=evt_id,
            title=title,
            description=description,
            venue=venue,
            date=date,
            status='PENDING_DEPT_STAFF',
            created_by=user.username,
            created_by_roll=user.roll_number,
            department=user.department
        )
        return Response(EventSerializer(evt).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def event_action_view(request, id):
    user = authenticate_user(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    action = request.data.get('action')
    remarks = request.data.get('remarks')

    if action not in ['APPROVE', 'REJECT']:
        return Response({'error': 'Action must be APPROVE or REJECT.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        evt = Event.objects.get(id=id)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

    allowed = False
    next_status = evt.status

    if evt.status == 'PENDING_DEPT_STAFF':
        if user.role == 'Dept Staff' and user.department == evt.department:
            allowed = True
            next_status = 'PENDING_DEAN' if action == 'APPROVE' else 'REJECTED'
    elif evt.status == 'PENDING_DEAN':
        if user.role == 'Dean':
            allowed = True
            next_status = 'PENDING_PRINCIPAL' if action == 'APPROVE' else 'REJECTED'
    elif evt.status == 'PENDING_PRINCIPAL':
        if user.role == 'Principal':
            allowed = True
            next_status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'

    if not allowed:
        return Response({'error': 'Access denied for this stage.'}, status=status.HTTP_403_FORBIDDEN)

    act_id = 'act-' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))
    EventActivity.objects.create(
        id=act_id,
        event=evt,
        actor_name=user.username,
        actor_role=user.role,
        action=action,
        remarks=remarks
    )

    evt.status = next_status
    evt.save()

    return Response(EventSerializer(evt).data)

@api_view(['GET', 'POST'])
def complaints_view(request):
    user = authenticate_user(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        if user.role == 'Student':
            qs = Complaint.objects.filter(raised_by=user.username)
        elif user.role in ['HOD', 'Dept Staff']:
            qs = Complaint.objects.filter(department=user.department)
        else:
            qs = Complaint.objects.all()
        qs = qs.order_by('-created_at')
        return Response(ComplaintSerializer(qs, many=True).data)

    elif request.method == 'POST':
        if user.role != 'Student':
            return Response({'error': 'Only students can submit complaints.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title')
        category = request.data.get('category')
        description = request.data.get('description')

        if not title or not category or not description:
            return Response({'error': 'Title, category, and description are required.'}, status=status.HTTP_400_BAD_REQUEST)

        comp_id = 'comp-' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))
        comp = Complaint.objects.create(
            id=comp_id,
            title=title,
            category=category,
            description=description,
            status='OPEN',
            raised_by=user.username,
            raised_by_roll=user.roll_number,
            department=user.department
        )
        return Response(ComplaintSerializer(comp).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def complaint_respond_view(request, id):
    user = authenticate_user(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    message = request.data.get('message', '').strip()
    status_val = request.data.get('status')

    if not message:
        return Response({'error': 'Response message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        comp = Complaint.objects.get(id=id)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

    is_hod = user.role == 'HOD' and user.department == comp.department
    is_dean = user.role == 'Dean'

    if not is_hod and not is_dean:
        return Response({'error': 'Only HOD or Dean can respond to grievances.'}, status=status.HTTP_403_FORBIDDEN)

    msg_id = 'msg-' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))
    ComplaintMessage.objects.create(
        id=msg_id,
        complaint=comp,
        sender_name=user.username,
        sender_role=user.role,
        message=message
    )

    if status_val in ['OPEN', 'IN_REVIEW', 'RESOLVED']:
        comp.status = status_val
    elif comp.status == 'OPEN':
        comp.status = 'IN_REVIEW'

    comp.save()
    return Response(ComplaintSerializer(comp).data)

@api_view(['GET'])
def admin_users_view(request):
    user = authenticate_user(request)
    if not user or user.role != 'Software Admin':
        return Response({'error': 'Software Admin privilege required.'}, status=status.HTTP_403_FORBIDDEN)
    users = User.objects.all().order_by('username')
    return Response(UserSerializer(users, many=True).data)

@api_view(['PUT'])
def admin_update_user_view(request, username):
    user = authenticate_user(request)
    if not user or user.role != 'Software Admin':
        return Response({'error': 'Software Admin privilege required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        target = User.objects.get(username__iexact=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    role = request.data.get('role')
    department = request.data.get('department')
    roll_number = request.data.get('rollNumber')

    if target.username.lower() == 'admin@clg' and role != 'Software Admin':
        return Response({'error': 'Cannot demote Software Admin account.'}, status=status.HTTP_400_BAD_REQUEST)

    if not role:
        return Response({'error': 'Role is required.'}, status=status.HTTP_400_BAD_REQUEST)

    target.role = role
    target.department = department if role in ['Student', 'Dept Staff', 'HOD'] else None
    target.roll_number = roll_number if role == 'Student' else None
    target.save()

    return Response(UserSerializer(target).data)
