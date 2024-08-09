import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email!: string;
  password!: string;

  constructor(
    private afAuth: AngularFireAuth, 
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  async login() {
    if (!this.email || !this.password) {
      this.showAlert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    try {
      const user = await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      if (user) {
        this.showAlert('Inicio de sesión exitoso', 'Has iniciado sesión correctamente.');
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      let message: string;

      switch (error.code) {
        case 'auth/invalid-email':
          message = 'El correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          message = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/user-not-found':
          message = 'No se encontró una cuenta con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          message = 'La contraseña es incorrecta.';
          break;
        default:
          message = 'Ocurrió un error. Intenta de nuevo.';
          break;
      }

      this.showAlert('Error de inicio de sesión', message);
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
