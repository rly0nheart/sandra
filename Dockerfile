# Use the official Nginx lightweight image
FROM nginx:alpine

# Set the working directory inside the container
WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy everything from the repo into the Nginx serving directory
COPY . .

# Expose port 80 to serve the site
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
