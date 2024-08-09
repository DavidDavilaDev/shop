import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  email!: string;
  password!: string;
  userName!: string; // Añadir esta línea

  constructor(private afAuth: AngularFireAuth, private navCtrl: NavController, private alertCtrl: AlertController, private router: Router) {}

  async register() {
    if (!this.email || !this.password || !this.userName) { // Verificar que el nombre de usuario no esté vacío
      this.showAlert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      await userCredential.user?.updateProfile({ displayName: this.userName }); // Actualizar el perfil con el nombre de usuario

      this.showAlert('Registro exitoso', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');
      this.router.navigate(['/login']);
    } catch (error: any) {
      let message: string;

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'El correo ya está en uso.';
          break;
        case 'auth/invalid-email':
          message = 'El correo electrónico no es válido.';
          break;
        case 'auth/operation-not-allowed':
          message = 'El registro con correo y contraseña no está habilitado.';
          break;
        case 'auth/weak-password':
          message = 'La contraseña es muy débil.';
          break;
        default:
          message = 'Ocurrió un error. Intenta de nuevo.';
          break;
      }

      this.showAlert('Error de registro', message);
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

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
