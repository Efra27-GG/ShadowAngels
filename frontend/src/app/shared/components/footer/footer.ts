import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContactService } from '../../../core/services/contact.service';
import { ContactInfo } from '../../interfaces/contact.interface';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent implements OnInit {
  private contactService = inject(ContactService);

  contact: ContactInfo = {
    whatsapp_number: '',
    whatsapp_label: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
    location: ''
  };

  ngOnInit(): void {
    this.contact = this.contactService.getCurrentContact();

    this.contactService.contact$.subscribe((contact) => {
      this.contact = contact;
    });

    this.contactService.loadContact().subscribe();
  }

  get whatsappText(): string {
    return this.contact.whatsapp_label || this.contact.whatsapp_number || 'Sin definir';
  }
}
