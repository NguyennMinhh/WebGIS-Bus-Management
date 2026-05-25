from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .auth_serializers import CurrentUserSerializer, LoginSerializer, RegisterSerializer


def _current_user_payload(user):
    return {
        'is_authenticated': user.is_authenticated,
        'username': user.username if user.is_authenticated else '',
        'email': user.email if user.is_authenticated else '',
        'is_staff': user.is_staff if user.is_authenticated else False,
    }


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def current_user(request):
    serializer = CurrentUserSerializer(_current_user_payload(request.user))
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    login(request, user)

    return Response(
        CurrentUserSerializer(_current_user_payload(user)).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    login(request, user)

    return Response(CurrentUserSerializer(_current_user_payload(user)).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response(CurrentUserSerializer(_current_user_payload(request.user)).data)
