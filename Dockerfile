# Use official Apache image
FROM httpd:alpine

# Remove default files
RUN rm -rf /usr/local/apache2/htdocs/*

# Copy your site from the src folder into Apache's web root
COPY src/ /usr/local/apache2/htdocs/

# Add .htaccess if you're using client-side routing
COPY .htaccess /usr/local/apache2/htdocs/

# RUN echo "ServerName radio.lan" >> /usr/local/apache2/conf/httpd.conf

# Expose port 80
EXPOSE 80
