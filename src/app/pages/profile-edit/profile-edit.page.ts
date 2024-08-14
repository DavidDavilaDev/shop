import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertController } from '@ionic/angular';
import { ProfileService } from 'src/app/services/profile.service';
import { Haptics, NotificationType, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.page.html',
  styleUrls: ['./profile-edit.page.scss'],
})
export class ProfileEditPage implements OnInit {
  user: any = {};
  newName!: string;
  newEmail!: string;
  newPassword!: string;
  confirmPassword!: string;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private afAuth: AngularFireAuth,
    private alertCtrl: AlertController,
    private router: Router,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  async loadUser() {
    const user = await this.afAuth.currentUser;
    if (user) {
      this.user = user;
      this.newName = user.displayName || '';
      this.newEmail = user.email || '';
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async updateProfile() {
    try {
      const user = await this.afAuth.currentUser;
      if (user) {
        if (this.newName !== user.displayName) {
          await user.updateProfile({ displayName: this.newName });
        }
        if (this.newEmail !== user.email) {
          await user.updateEmail(this.newEmail);
        }
        if (this.newPassword && this.newPassword === this.confirmPassword) {
          await user.updatePassword(this.newPassword);
        } else if (this.newPassword !== this.confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }
        this.profileService.updateProfile(user);
        await this.showAlert('Éxito', 'Perfil actualizado correctamente.');
        await Haptics.impact({ style: ImpactStyle.Medium });
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      await this.showAlert('Error', error.message || 'No se pudo actualizar el perfil. Intenta de nuevo.');
      await Haptics.notification({ type: NotificationType.Error });
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

  goToHome() {
    this.router.navigate(['/home']);
  }
}
