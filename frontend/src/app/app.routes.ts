import { Routes } from '@angular/router';
import { HelpComponent } from './components/help/help.component';
import { AboutComponent } from './components/about/about.component';
import { MapComponent } from './components/map/map.component';
import { HomeComponent } from './components/home/home.component';
import { BaunitComponent } from './components/baunit/baunit/baunit.component';
import { PartyComponent } from './components/party/party/party.component';
import { SourceComponent } from './components/source/source/source.component';
import { ImageComponent } from './components/source/image/image.component';
import { AppUserComponent } from './components/auth/app-user/app-user.component';
import { LoginComponent } from './components/auth/login/login.component';
import { LogoutComponent } from './components/auth/logout/logout.component';
import { isLoggedInGuard } from './guards/is-logged-in.guard';
import { simpleAuthGuard } from './guards/simple-auth.guard';
import { YouDontHavePermissionComponent } from './components/auth/you-dont-have-permission/you-dont-have-permission.component';
import { belongsToGroupGuard } from './guards/belongs-to-group.guard';
import { BlankComponent } from './components/auth/blank/blank.component';
import { RemoveSessionsComponent } from './components/auth/remove-sessions/remove-sessions.component';
import { LastAppVersionComponent } from './components/admin/app-version/last-app-version/last-app-version.component';
import { ManageAppVersionsComponent } from './components/admin/app-version/manage-app-versions/manage-app-versions.component';
import { AddAppVersionComponent } from './components/admin/app-version/add-app-version/add-app-version.component';
import { BaunitListComponent } from './components/baunit/baunit-list/baunit-list.component';
import { ApiSettingsComponent } from './components/admin/api-settings/api-settings.component';
import { DjangoAndAppUsersComponent } from './components/admin/django-and-app-users/django-and-app-users.component';


export const routes: Routes = [
    {path: '', redirectTo: '/home', pathMatch: 'full'},
    {path: 'help', component:HelpComponent},
    {path: 'about', component:AboutComponent},
    {path: 'map', component:MapComponent, canActivate: [simpleAuthGuard]},
    {path: 'home', component:HomeComponent},
    {path: 'app_user', component:AppUserComponent},
    {path: 'login', component:LoginComponent},
    {path: 'logout', component:LogoutComponent},
    {path: 'remove_sessions',component:RemoveSessionsComponent},
    {path: 'last_app_version', component: LastAppVersionComponent},
    {path: 'add_app_version', component: AddAppVersionComponent},
    {path: 'manage_app_versions', component: ManageAppVersionsComponent},
    {path: 'baunit_list', component: BaunitListComponent},
    {path: 'api_settings', component: ApiSettingsComponent},
    {path: 'manage_django_and_app_users', component: DjangoAndAppUsersComponent},
    
    {path: 'baunit', component:BaunitComponent, outlet:'right_sidenav',
        canActivate:[belongsToGroupGuard],
        data:{allowedGroups: ['topografo']}
    },
    {path: 'party', canActivate:[isLoggedInGuard], component:PartyComponent, outlet:'right_sidenav'},
    {path: 'source', canActivate:[isLoggedInGuard], component:SourceComponent, outlet:'right_sidenav'},
    {path: 'image', canActivate:[isLoggedInGuard], component:ImageComponent, outlet:'right_sidenav'},
    {path: 'you_dont_have_permission', component:YouDontHavePermissionComponent, outlet:'right_sidenav'},
    {path: 'blank', component:BlankComponent, outlet:'right_sidenav'}
];
