# Sistema Otimização não Linear

<img width="800" src="https://raw.githubusercontent.com/JonathanRaniereM/sistema_otimizacao/main/otimizacao_front/src/views/assets/images/otimizacao_demonstrativo.gif">

## Sobre o Projeto

Desenvolvido para ser uma aplicação interativa destinada à otimização não linear em ambiente academico, oferece uma solução robusta em visualização e cálculo de funções objetivo. A principal funcionalidade do sistema é o compartilhamento de amostragem de funções matemáticas customizadas e suas plotagens, na intenção de explorar métodos de otimização, como o gradiente descendente e estratégias randomicas, para encontrar pontos ótimos. 

### Características Principais

- **API DJANGO**: API desenvolvida em Django é responsável por interpretar as expressões matemáticas fornecidas pelos usuários, juntamente com os limites e o número de iterações especificados. Essa API processa as informações e as transforma em coordenadas prontas para serem visualizadas graficamente no front-end através de Plotly.js.
  
- **Sincronização em Tempo Real com Redis Server e Django Channels**: Tecnologia que facilita tanto o recebimento de novos dados de entrada quanto o envio dos resultados da otimização de volta para o front-end. Utilizando o Redis para o gerenciamento eficiente das mensagens via WebSockets, o sistema permite não apenas a comunicação ponto a ponto, mas também oferece a opção de transmitir os resultados para todos os usuários conectados simultaneamente.



## Motivação

Este projeto foi desenvolvido visando atender à necessidade de um sistema de otimização pensado para o ambiente acadêmico, onde professores podem desejar que todos os alunos visualizem as soluções geradas durante uma sessão interativa, promovendo um ambiente de aprendizado colaborativo e engajador.



## Requisitos

Esse sistema foi projetado para rodar em servidores linux Ubuntu.

- Node 14.0v (ou acima)
- Apache ou Nginx
- Git
- Redis 6.0.1 (Server para mensagens websockets)


## Contribuição

Sua contribuição é bem-vinda! Se você tem interesse em contribuir para o projeto, por favor, leia o arquivo CONTRIBUTING.md para mais informações sobre como proceder.

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE.md para mais detalhes.

---

Para mais informações, por favor, entre em contato conosco através de enginerdeveloper7@gmail.com.

Agradecemos seu interesse e apoio ao nosso projeto!
