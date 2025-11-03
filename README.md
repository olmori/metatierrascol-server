# Docker Django API template

It is a Docker template to start Django + DRF + GeoDjango APIs.
It cams with a working example in the buildings app.

# Help

- Clone the repo:

```ruby
    git clone https://github.com/junior0428/metatierrascol-server.git
```

- Change to the project folder:
```ruby
    cd django-api-template
```
- Create the pgadmin folders:
```ruby
    Windows: pgadmin_create_folders_windows.bat
    Linux: ./pgadmin_create_folders_linux.sh
```
- Create the containers and start the services:
```ruby
    docker compose up | docker compose up --build
```
- Check the services:

    - pgadmin: http://localhost:8050
    - geoserver: http://localhost:8080
    - Django API: http://localhost:8000/apphelloworld/hello_world/
    - Frontend: http://localhost:4400

# Start developping
To avoid to install Pyhton and its dependencies in your computer, you can 
use the interpreter in the container. You can achieve this with Visual Studio Code (VS).

- Start the services: docker compose up.
- Open VS.
- Press Ctrl + Shift + p.
- Paste the following: Dev Containers: Attach to Running Container.
- Select the container *-djangoapi-1.
- A new VS code window is started.
- In the terminal, change to the folder /home/$username, where the source code is.
- Select the interpreter: Ctrl + Shift + p, and type python select interpreter, and select the interpreter in the container. There are two interpreters. Select the one in 
/usr/local/bib/python. This one is the one that has all the pythin mackages installed: Django, GeoDjango, etc. In this way VS will help you to code.
- Now, you can modify the source files, and create new Django apps from the VS connected to the container.
- To create a new app, in the terminal, in the VS connected to the container, type: 
```ruby
    python manage.py startapp mynewapp | docker compose exec djangoapi python manage.py startapp mynewapp
```

# Debugging

RemoteDebug has been configured in the VS project and in settings.py. To stop the execution in a line:

- If you change the username in the file .env, you musy change the file .vscode/launch.json:

      "remoteRoot": "/home/joamona"   <-- Change joamona to your username

- Put a breackpoint.
- Set, in djangoapi/settings.py, the REMOTE_DEBUG to true.
- Open the Debug window of VS and click Play over the DjangoAPI configuration.
- Ready to debug.

# Installed apps

The project cams with three app:

- core: It has the myLib package, who contains the geoModelSerializer. It is a base class to manage models with geometries. Ii uses geodjango.
- codelist: It is empty. It us thougt to contain all the models who represents codelists of possible values for other models.
- buildings: It contains a model, serializer, and modelViewSet as example of DFR and  geoModelSerializer example. 


# run commands
```ruby
ng serve -o --port 46335
```

```ruby
docker compose exec djangoapi python manage.py migrate
```

```ruby
docker compose exec djangoapi python manage.py createsuperuser
```

```ruby
docker compose exec djangoapi python manage.py makemigrations metatierrascol
```



