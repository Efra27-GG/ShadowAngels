import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';
import { HeroService } from '../../../core/services/hero.service';

@Component({
  selector: 'app-hero-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminShellComponent],
  templateUrl: './hero-admin.html',
  styleUrl: './hero-admin.css'
})
export class HeroAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private heroService = inject(HeroService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';
  imagePreview = '';
  imageName = '';

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(90)]],
    subtitle: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(180)]]
  });

  ngOnInit(): void {
    this.heroService.loadHero().subscribe({
      next: (hero) => {
        this.form.patchValue({
          title: hero.title,
          subtitle: hero.subtitle
        });
        this.imageName = hero.image || '';
        this.imagePreview = this.heroService.getImagePath(hero.image);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar la configuración del banner principal.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Revisa los campos del banner principal antes de guardar.';
      this.successMessage = '';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const rawValue = this.form.getRawValue();
    this.heroService.updateHero({
      title: rawValue.title || '',
      subtitle: rawValue.subtitle || '',
      image: this.imageName
    }).subscribe({
      next: () => {
        this.successMessage = 'Banner principal actualizado correctamente.';
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo guardar el banner principal.';
        this.successMessage = '';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Selecciona una imagen valida para el banner principal.';
      this.successMessage = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La imagen del banner principal no debe superar los 5 MB.';
      this.successMessage = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.heroService.uploadImage(file).subscribe({
      next: (response) => {
        this.imageName = response.images[0] || '';
        this.imagePreview = this.heroService.getImagePath(this.imageName);
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo subir la imagen del banner principal.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeImage(): void {
    this.imageName = '';
    this.imagePreview = '';
    this.cdr.detectChanges();
  }

  get controls() {
    return this.form.controls;
  }
}
