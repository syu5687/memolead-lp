FROM php:8.1-apache

ENV PORT=8080
EXPOSE 8080

# Cloud Run用Apache設定
RUN sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf \
 && echo "ServerName localhost" >> /etc/apache2/apache2.conf

# mod_rewrite / mod_headers 有効化（ディレクトリ一覧は下の Options -Indexes で無効化）
RUN a2enmod rewrite headers \
 && sed -i "s/AllowOverride None/AllowOverride All/" /etc/apache2/apache2.conf

# /var/www/html 設定（Indexes無し＝一覧表示なし。ドットファイルや .git 等は配信拒否）
RUN printf '%s\n' \
  '<Directory /var/www/html>' \
  '    Options FollowSymLinks' \
  '    AllowOverride All' \
  '    Require all granted' \
  '</Directory>' \
  '<DirectoryMatch "\.git">' \
  '    Require all denied' \
  '</DirectoryMatch>' \
  '<FilesMatch "^\.">' \
  '    Require all denied' \
  '</FilesMatch>' >> /etc/apache2/apache2.conf

# ファイル配置
COPY . /var/www/html

# パーミッション
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 /var/www/html
