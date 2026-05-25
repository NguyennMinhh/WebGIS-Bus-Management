from django.contrib.auth import authenticate, get_user_model, password_validation
from rest_framework import serializers


User = get_user_model()


class CurrentUserSerializer(serializers.Serializer):
    is_authenticated = serializers.BooleanField()
    username = serializers.CharField(allow_blank=True)
    email = serializers.EmailField(allow_blank=True)
    is_staff = serializers.BooleanField()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_username(self, value):
        username = value.strip()

        if not username:
            raise serializers.ValidationError('Username is required.')

        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError('This username is already taken.')

        return username

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        username = attrs.get('username', '').strip()
        password = attrs.get('password', '')
        request = self.context.get('request')
        user = authenticate(request=request, username=username, password=password)

        if user is None:
            raise serializers.ValidationError('Invalid username or password.')

        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')

        attrs['user'] = user
        return attrs
