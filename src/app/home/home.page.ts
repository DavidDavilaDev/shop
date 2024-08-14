import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getDatabase, ref, set, push, onValue, remove, DataSnapshot } from 'firebase/database';
import { Subscription } from 'rxjs';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { ProductModalPage } from '../pages/product-modal/product-modal.page';  // Asegúrate de crear una página de modal para productos
import { ProfileService } from '../services/profile.service';
import { AlertController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  userPhotoURL: string | null = null;
  userName: string | null = null;
  products: any[] = [];
  private authSubscription: Subscription | undefined;
  private profileSubscription: Subscription | undefined;
  productName: any;
  productDescription: any;
  filteredProducts: any[] = [];
  searchTerm: any;

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private profileService: ProfileService,
    private alertController: AlertController,
    private platform: Platform,
  ) {
    this.filteredProducts = [...this.products];
  }

  ngOnInit() {
    this.authSubscription = this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userPhotoURL = user.photoURL || 'assets/default-profile-pic.jpg';
        this.userName = user.displayName || 'Invitado';
        this.loadProducts(user.uid);
      } else {
        this.router.navigate(['/login']);
      }
    });
  
    this.platform.resume.subscribe(async () => {
      const user = await this.afAuth.currentUser;
      if (user) {
        this.loadProducts(user.uid);
      }
    });
  
    this.profileSubscription = this.profileService.userProfile$.subscribe(profile => {
      if (profile) {
        this.userPhotoURL = profile.photoURL || 'assets/default-profile-pic.jpg';
        this.userName = profile.displayName || 'Invitado';
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => 
      product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Editar Perfil',
          icon: 'create',
          handler: () => {
            this.goToProfileEdit();
          }
        },
        {
          text: 'Cerrar Sesión',
          icon: 'log-out',
          role: 'destructive',
          handler: () => {
            this.logout();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  goToProfileEdit() {
    this.router.navigate(['/profile-edit']);
  }

  async logout() {
    try {
      await this.afAuth.signOut();
      await Haptics.notification({ type: NotificationType.Success });
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async addProduct() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const db = getDatabase();
      const productRef = ref(db, `products/${user.uid}`);
      const newProductRef = push(productRef);
      const product = {
        name: this.productName,
        description: this.productDescription,
        userId: user.uid,
        timestamp: new Date().toISOString()
      };

      set(newProductRef, product).then(() => {
        this.productName = '';
        this.productDescription = '';
        this.loadProducts(user.uid);
        Haptics.impact({ style: ImpactStyle.Medium });
      }).catch(error => {
        console.error('Error adding product:', error);
      });
    }
  }

  loadProducts(userId: string) {
    const db = getDatabase();
    const productsRef = ref(db, `products/${userId}`);
    onValue(productsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      this.products = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      this.filteredProducts = [...this.products]; // Asegúrate de que filteredProducts también se actualice
      console.log('Products loaded:', this.products); // Verifica los datos cargados
    });
  }

  async openProductModal() {
    const modal = await this.modalController.create({
      component: ProductModalPage  // Reemplaza NoteModalPage con ProductModalPage
    });
    modal.onDidDismiss().then(() => {
      this.ngOnInit(); // Refresh products after modal is dismissed
    });
    return await modal.present();
  }

  async editProduct(product: any) {
    const modal = await this.modalController.create({
      component: ProductModalPage,
      componentProps: { product }
    });
    modal.onDidDismiss().then(() => {
      this.ngOnInit(); // Refresh products after modal is dismissed
    });
    return await modal.present();
  }

  async deleteProduct(productId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar este producto?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Eliminar',
          handler: async () => {
            const user = await this.afAuth.currentUser;
            if (user) {
              const db = getDatabase();
              const productRef = ref(db, `products/${user.uid}/${productId}`);
              await remove(productRef);
              this.loadProducts(user.uid); // Recarga los productos después de eliminar
              Haptics.notification({ type: NotificationType.Error });
            }
          }
        }
      ]
    });
  
    await alert.present();
  }
}
