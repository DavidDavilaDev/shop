import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private userProfileSubject = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private afStorage: AngularFireStorage
  ) {}

  updateProfile(profile: any) {
    this.userProfileSubject.next(profile);
  }

  async takePhotoAndUpload() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });

    if (image && image.base64String) {
      await this.uploadProfilePicture(image.base64String);
    }
  }

  async uploadProfilePicture(base64String: string) {
    const user = await this.afAuth.currentUser;
    if (user) {
      const filePath = `profile_pictures/${user.uid}/profile_picture.jpeg`;
      const fileRef = this.afStorage.ref(filePath);
      const task = this.afStorage.upload(filePath, `data:image/jpeg;base64,${base64String}`);

      return new Promise<void>((resolve, reject) => {
        task.snapshotChanges().pipe(
          finalize(async () => {
            try {
              const downloadURL = await fileRef.getDownloadURL().toPromise();
              await user.updateProfile({ photoURL: downloadURL });
              this.updateProfile({ ...user, photoURL: downloadURL });
              resolve();
            } catch (error) {
              reject(error);
            }
          })
        ).subscribe();
      });
    }
  }
}
