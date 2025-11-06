FROM nginx:alpine

# Удаляем дефолтную конфигурацию
RUN rm /etc/nginx/conf.d/default.conf

# Копируем свою (если она есть)
COPY ./front/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем все статические файлы сайта
COPY ./front /usr/share/nginx/html

# Устанавливаем права (иначе может быть 403)
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
