import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ContactService } from '../../../core/services/contact.service';
import { ContactInfo } from '../../interfaces/contact.interface';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);

  public contact: ContactInfo = {
    whatsapp_number: '',
    whatsapp_label: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
    location: ''
  };

  public ngOnInit(): void {
    this.contact = this.contactService.getCurrentContact();

    this.contactService.contact$.subscribe((contact) => {
      this.contact = contact;
    });

    this.contactService.loadContact().subscribe();
  }

  public get whatsappText(): string {
    return this.contact.whatsapp_label || this.contact.whatsapp_number || 'Sin definir';
  }

  public navigateFromFooter(path: string): void {
    this.router.navigate([path]).then((navigated) => {
      if (navigated) {
        this.viewportScroller.scrollToPosition([0, 0]);
      }
    });
  }

  public goToAdminLogin(): void {
    this.navigateFromFooter('/admin/login');
  }
}
