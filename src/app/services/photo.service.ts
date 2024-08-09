import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, combineLatest } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: string[] = [];

  constructor(private storage: AngularFireStorage) { }

  public async addPhoto(): Promise<any> {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 100
    });
  
    const blob = this.dataUrlToBlob(photo.dataUrl!);
    const filePath = `photos/${uuidv4()}.jpeg`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, blob);
  
    return new Promise((resolve, reject) => {
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            this.photos.push(url);
            resolve(photo); // Devuelve el objeto de la foto
          });
        })
      ).subscribe({
        error: reject
      });
    });
  }
  

  public listPhotos(): Observable<string[]> {
    const listRef = this.storage.ref('photos');
    return listRef.listAll().pipe(
      switchMap(result => {
        const urls$ = result.items.map(itemRef => itemRef.getDownloadURL());
        return combineLatest(urls$);
      }),
      map(urls => {
        this.photos = urls;
        return urls;
      })
    );
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  private getFilePathFromUrl(url: string): string {
    const regex = /o\/([^?]*)/;
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : '';
  }  

  public deletePhoto(url: string) {
    const filePath = this.getFilePathFromUrl(url);
    const fileRef = this.storage.ref(filePath);
  
    fileRef.delete().pipe(
      finalize(() => {
        // Actualiza la lista de fotos después de eliminar la foto
        this.photos = this.photos.filter(photo => photo !== url);
      })
    ).subscribe({
      next: () => {
        console.log('Photo deleted successfully.');
      },
      error: (err) => {
        console.error('Error deleting photo: ', err);
      }
    });
  }
  
  
}


