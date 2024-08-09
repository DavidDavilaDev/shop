import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteModalPage } from './note-modal.page';

describe('NoteModalPage', () => {
  let component: NoteModalPage;
  let fixture: ComponentFixture<NoteModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
