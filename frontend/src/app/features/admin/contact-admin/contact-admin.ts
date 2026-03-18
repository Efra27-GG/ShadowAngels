import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';
import { ContactService } from '../../../core/services/contact.service';
import { ContactInfo } from '../../../shared/interfaces/contact.interface';

@Component({
  selector: 'app-contact-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminShellComponent],
  templateUrl: './contact-admin.html',
  styleUrl: './contact-admin.css'
})
export class ContactAdminComponent implements OnInit {
  private readonly urlPattern = /^https?:\/\/.+/i;
  private readonly phonePattern = /^\d{10,15}$/;
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  successMessage = '';
  errorMessage = '';

  form = this.fb.group({
    whatsapp_number: ['', Validators.pattern(this.phonePattern)],
    whatsapp_label: ['', [Validators.minLength(6), Validators.maxLength(40)]],
    instagram: ['', Validators.pattern(this.urlPattern)],
    facebook: ['', Validators.pattern(this.urlPattern)],
    tiktok: ['', Validators.pattern(this.urlPattern)],
    email: ['', Validators.email],
    location: ['', [Validators.maxLength(140)]]
  });

  ngOnInit(): void {
    this.contactService.loadContact().subscribe({
      next: (contact) => {
        this.form.patchValue({
          whatsapp_number: contact.whatsapp_number,
          whatsapp_label: contact.whatsapp_label || contact.whatsapp_number,
          instagram: contact.instagram,
          facebook: contact.facebook,
          tiktok: contact.tiktok,
          email: contact.email,
          location: contact.location
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar la configuracion de contacto.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Revisa el formato de los campos antes de guardar.';
      this.successMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const payload: ContactInfo = {
      whatsapp_number: (this.form.getRawValue().whatsapp_number || '').replace(/\D/g, ''),
      whatsapp_label: this.form.getRawValue().whatsapp_label || '',
      instagram: this.form.getRawValue().instagram || '',
      facebook: this.form.getRawValue().facebook || '',
      tiktok: this.form.getRawValue().tiktok || '',
      email: this.form.getRawValue().email || '',
      location: this.form.getRawValue().location || ''
    };

    this.contactService.updateContact(payload).subscribe({
      next: () => {
        this.successMessage = 'La informacion de contacto se actualizo correctamente.';
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo guardar la informacion de contacto.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  get controls() {
    return this.form.controls;
  }
}
