# Dockerfile en la carpeta FRONTEND_E-HYDRO
FROM node:20

# 1. Establecer el directorio de trabajo
WORKDIR /usr/src/app

# 2. Copiar archivos de dependencias
COPY package*.json ./

# 3. Instalar utilidades que necesites
RUN apt-get update && apt-get install -y p7zip-full postgresql-client

# 4. Instalar dependencias del proyecto
RUN npm install

# 5. Copiar el resto del código
COPY . .

# 6. Compilar la aplicación Angular
#    - Si usas "npm run build" a secas, usará environment.ts
#    - Si usas "npm run build --configuration production" usará environment.prod.ts
RUN npm run build

# 7. Exponer el puerto donde se servirá el contenido (3000 en tu caso)
EXPOSE 3000

# 8. Servir la aplicación compilada con "serve" (la carpeta dist/E-Hydro)
CMD ["npx", "serve", "-s", "dist/metatierrascol-web/browser", "-l", "3000"]