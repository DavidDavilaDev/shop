import { Component, Input, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getDatabase, ref, push, set, update } from 'firebase/database';

@Component({
  selector: 'app-note-modal',
  templateUrl: './note-modal.page.html',
  styleUrls: ['./note-modal.page.scss'],
})
export class NoteModalPage implements OnInit {
  noteTitle: string = '';
  noteContent: string = '';
  noteColor: string = '#ffffff';  // Default color (white)
  isEditMode: boolean = false;
  noteId: string | null = null;
  @Input() note: any;

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit() {
    const note = this.navParams.get('note');
    if (note) {
      // Switch to edit mode
      this.isEditMode = true;
      this.noteTitle = note.title;
      this.noteContent = note.content;
      this.noteColor = note.color || '#ffffff';  // Set color if available
      this.noteId = note.id; // Ensure that the note has an 'id' property
    } else {
      // Remain in add mode
      this.isEditMode = false;
    }
  }

  async saveNote() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const db = getDatabase();
      const notesRef = ref(db, `notes/${user.uid}`);

      if (this.isEditMode && this.noteId) {
        // Update existing note
        const noteRef = ref(db, `notes/${user.uid}/${this.noteId}`);
        const updatedNote = {
          title: this.noteTitle,
          content: this.noteContent,
          color: this.noteColor,  // Include color in updated note
          timestamp: new Date().toISOString()
        };
        await update(noteRef, updatedNote)
          .then(() => {
            this.dismissModal();
          })
          .catch(error => {
            console.error('Error updating note:', error);
          });
      } else {
        // Add new note
        const newNoteRef = push(notesRef);
        const newNote = {
          title: this.noteTitle,
          content: this.noteContent,
          color: this.noteColor,  // Include color in new note
          timestamp: new Date().toISOString()
        };
        await set(newNoteRef, newNote)
          .then(() => {
            this.dismissModal();
          })
          .catch(error => {
            console.error('Error adding note:', error);
          });
      }
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }
}
