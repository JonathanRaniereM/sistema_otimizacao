
from .consumers import OtimizeConsumer
from channels.routing import URLRouter

from django.urls import re_path



websocket_urlpatterns = [
    re_path(
        r'ws/manage_otimize/(?P<reuniao_id>\w+)/$', OtimizeConsumer.as_asgi(),
    ),
    re_path(
        r'ws/manage_otimize/$', OtimizeConsumer.as_asgi(),  # rota sem reuniao_id
    ),
]


