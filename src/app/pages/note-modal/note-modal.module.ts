import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NoteModalPageRoutingModule } from './note-modal-routing.module';

import { NoteModalPage } from './note-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NoteModalPageRoutingModule
  ],
  declarations: [NoteModalPage]
})
export class NoteModalPageModule {}
