# consumers.py

from channels.db import database_sync_to_async
from djangochannelsrestframework import permissions
from djangochannelsrestframework.generics import GenericAsyncAPIConsumer
from djangochannelsrestframework.mixins import (
    ListModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DeleteModelMixin,
    RetrieveModelMixin,
)

import logging
import uuid

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from rest_framework.renderers import JSONRenderer


# Configure o logger
logger = logging.getLogger(__name__)

specificStatusCodeMappings = {
    '1000': 'Normal Closure',
    '1001': 'Going Away',
    '1002': 'Protocol Error',
    '1003': 'Unsupported Data',
    '1004': '(For future)',
    '1005': 'No Status Received',
    '1006': 'Abnormal Closure',
    '1007': 'Invalid frame payload data',
    '1008': 'Policy Violation',
    '1009': 'Message too big',
    '1010': 'Missing Extension',
    '1011': 'Internal Error',
    '1012': 'Service Restart',
    '1013': 'Try Again Later',
    '1014': 'Bad Gateway',
    '1015': 'TLS Handshake'
}

def getStatusCodeString(code):
    if code is None:
        return "Código de status desconhecido"
    if (code >= 0 and code <= 999):
        return '(Unused)'
    elif (code >= 1016):
        if (code <= 1999):
            return '(For WebSocket standard)'
        elif (code <= 2999):
            return '(For WebSocket extensions)'
        elif (code <= 3999):
            return '(For libraries and frameworks)'
        elif (code <= 4999):
            return '(For applications)'
    return specificStatusCodeMappings.get(code, '(Unknown)')

import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)
connected_users = {}  

class OtimizeConsumer(AsyncJsonWebsocketConsumer):
    
    async def connect(self):
        logger.info("Conexão estabelecida.")
        print("Método connect chamado!")

        reuniao_id = self.scope['url_route']['kwargs'].get('reuniao_id', 'global')

        self.room_group_name = f"presenca_{reuniao_id}"
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        self.accept()
        
        await super().connect()
        await self.send_json({
            'type': 'nickname_request'
        })
        logger.info(f"Conexão estabelecida. Conectado ao grupo {self.room_group_name}.")

    async def disconnect(self, close_code):
        if hasattr(self, 'nickname') and self.channel_name in connected_users:
            del connected_users[self.channel_name]
            logger.info(f"Usuário {self.nickname} desconectado.")
        
        status_message = getStatusCodeString(close_code)
        logger.info(f"Desconexão com código: {close_code} - {status_message}")
        await self.channel_layer.group_discard(
            self.room_group_name,  # use a variável de nome de grupo dinâmico
            self.channel_name
        )
        await super().disconnect(close_code)

    async def receive_json(self, content, **kwargs):
        action = content.get('action')
        logger.info(f"Recebido: {content}")
        if action == 'authenticate':
            self.nickname = content['nickname']
            # self.user_id = self.scope['session'].session_key
            self.user_id = str(uuid.uuid4())
            connected_users[self.channel_name] = {
                'id': self.user_id,
                'nickname': self.nickname
            }
            logger.info(f"Usuário {self.nickname} conectado com ID {self.user_id}.")
             # Enviar mensagem ao grupo sobre o novo usuário
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_joined',
                    'user_id': self.user_id,
                    'nickname': self.nickname
                }
            )
            await self.send_json({
                'type': 'authenticated',
                'id': self.user_id,
                'nickname': self.nickname
            })

        if action == 'get_users':
            await self.send_json({
                'type': 'user_list',
                'users': [
                    {'id': user['id'], 'nickname': user['nickname']}
                    for user in connected_users.values()
                ]
            })
        if action == 'optimize':
            await self.perform_optimization(content)
        else:
            logger.warning(f"Ação desconhecida recebida: {action}")

    async def perform_optimization(self, content):
        type = content.get('type', '')
        action = content.get('action', '')
        method = content.get('method', '')
        users = content.get('users', [])
        data = content.get('data', {})
        result = content.get('result', '')
        optimize_all = content.get('optimize_all', False)
        logger.info(f"Iniciando otimização com método: {method}, dados: {data}")
        
        from .optimization import method_random_and_method_gradient

        if method == 'random':
            result = await database_sync_to_async(method_random_and_method_gradient)(data)
      
        else:
           
            logger.error(f"Método de otimização desconhecido: {method}")

        response = {
            'type': type,
            'action': action,
            'optimize_all': optimize_all,
            'method': method,
            'data': data,
            'result': result,
        }
        
        logger.info(f"Enviando resultado da otimização: {response}")
        if optimize_all:
             # Obter o canal do remetente
            sender_channel_name = self.channel_name
        
        # Iterar sobre os membros do grupo e enviar a mensagem, exceto para o remetente
            for user_channel, user_info in connected_users.items():
                if user_channel != sender_channel_name:
                    await self.channel_layer.send(
                        user_channel,
                        {
                            'type': 'perform_optimization_update',
                            'message': response
                        }
                    )
        elif len(users) == 0:
            await self.send_json(response)
        else:
            await self.send_json(response)
            for user_channel, user_info in connected_users.items():
                logger.info(f"user_info: {user_info}")
                if user_info['id'] in users:
                    await self.channel_layer.send(
                        user_channel,
                        {
                            'type': 'perform_optimization_update',
                            'message': response
                        }
                    )
        
    async def perform_optimization_update(self, event):
        # Extrai a mensagem de 'event' que foi enviada pelo 'group_send'
        message = event['message']
        logger.info(f"Repassando mensagem ao grupo: {message}")
        await self.send_json(message)

    async def user_joined(self, event):
        user_id = event['user_id']
        nickname = event['nickname']
        logger.info(f"Usuário {nickname} (ID: {user_id}) entrou.")
        await self.send_json({
            'type': 'user_joined',
            'user_id': user_id,
            'nickname': nickname
        })   
        
    async def send_json(self, content, close=False):
        logger.info(f"Enviando mensagem: {content}")
        await super().send_json(content, close=close)

    def getStatusCodeString(code):

        specificStatusCodeMappings = {
            '1000': 'Normal Closure',
            '1001': 'Going Away',
            '1002': 'Protocol Error',
            '1003': 'Unsupported Data',
            '1004': '(For future)',
            '1005': 'No Status Received',
            '1006': 'Abnormal Closure',
            '1007': 'Invalid frame payload data',
            '1008': 'Policy Violation',
            '1009': 'Message too big',
            '1010': 'Missing Extension',
            '1011': 'Internal Error',
            '1012': 'Service Restart',
            '1013': 'Try Again Later',
            '1014': 'Bad Gateway',
            '1015': 'TLS Handshake'
        }
        if code is None:
            return "Código de status desconhecido"
        if 0 <= code <= 999:
            return '(Unused)'
        elif 1016 <= code <= 1999:
            return '(For WebSocket standard)'
        elif 2000 <= code <= 2999:
            return '(For WebSocket extensions)'
        elif 3000 <= code <= 3999:
            return '(For libraries and frameworks)'
        elif 4000 <= code <= 4999:
            return '(For applications)'
        return specificStatusCodeMappings.get(code, '(Unknown)')