import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getDatabase, ref, set, update, push } from 'firebase/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { Haptics, NotificationType, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-product-modal',
  templateUrl: './product-modal.page.html',
  styleUrls: ['./product-modal.page.scss'],
})
export class ProductModalPage implements OnInit {
  @Input() product: any;

  productName: string = '';
  productDescription: string = '';
  productPrice: number | null = null;
  productImage: string | null = null;
  selectedImage: File | null = null;

  constructor(
    private modalController: ModalController,
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    if (this.product) {
      this.productName = this.product.name;
      this.productDescription = this.product.description;
      this.productPrice = this.product.price;
      this.productImage = this.product.imageURL;
    }
  }

  onFileSelected(event: any) {
    this.selectedImage = event.target.files[0] ?? null;
  }

  async saveProduct() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const db = getDatabase();
      const productRef = this.product 
        ? ref(db, `products/${user.uid}/${this.product.id}`)
        : push(ref(db, `products/${user.uid}`));

      const productData = {
        name: this.productName,
        description: this.productDescription,
        price: this.productPrice,
        userId: user.uid,
        timestamp: new Date().toISOString(),
        imageURL: this.productImage || ''
      };

      if (this.selectedImage) {
        const filePath = `product_images/${user.uid}/${productRef.key}`;
        const fileRef = this.storage.ref(filePath);
        const uploadTask = this.storage.upload(filePath, this.selectedImage);

        uploadTask.snapshotChanges().pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe((url) => {
              productData.imageURL = url;
              this.saveToDatabase(productRef, productData);
            });
          })
        ).subscribe();
      } else {
        this.saveToDatabase(productRef, productData);
      }
    }
  }

  private saveToDatabase(productRef: any, productData: any) {
    const operation = this.product ? update(productRef, productData) : set(productRef, productData);

    operation.then(() => {
      Haptics.impact({ style: ImpactStyle.Medium });
      this.closeModal();
    }).catch(error => {
      console.error('Error saving product:', error);
      Haptics.notification({ type: NotificationType.Error });
    });
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
