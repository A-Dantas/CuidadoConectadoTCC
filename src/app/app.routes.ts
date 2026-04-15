import { Routes } from '@angular/router';
import { AboutComponent } from './features/about/about.component';
import { HomeComponent } from './features/home/home.component';
import { FormsComponent } from './features/forms/forms.component';
import { LoginComponent } from './features/login/login.component';
import { GestorComponent } from './features/system/gestor/gestor.component';
import { CuidadorComponent } from './features/system/cuidador/cuidador.component';
import { MedicoComponent } from './features/system/medico/medico.component';
import { FamiliarComponent } from './features/system/familiar/familiar.component';
import { gestorGuard } from './core/auth/gestor.guard';
import { CadastroExternoComponent } from './features/cadastro-externo/cadastro-externo.component';

export const routes: Routes = [
    {
        path: 'cadastro/:tipo',
        component: CadastroExternoComponent
    },

    {
        path: 'home',
        loadComponent: () =>
            import('./features/home/home.component')
                .then(m => m.HomeComponent)
    },

    {
        path: 'about',
        component: AboutComponent
    },

    {
        path: 'forms',
        component: FormsComponent
    },

    {
        path: 'login',
        component: LoginComponent
    },

    {
        path: 'gestor',
        component: GestorComponent,
        canActivate: [gestorGuard]  
    },

    {
        path: 'cuidador',
        component: CuidadorComponent
    },

    {
        path: 'medico',
        component: MedicoComponent
    },

    {
        path: 'familiar',
        component: FamiliarComponent
    },

    // O padrão é que a rota seja "/home", caso aconteça do usuário apagar o '/home' será redirecionado para a /home
    {
        path: '', redirectTo: 'home', pathMatch: 'full'
    },

    // Essa rota vai direcionar para a página home em caso de erro 404
    {
        path: '**',
        component: HomeComponent
    },

];
