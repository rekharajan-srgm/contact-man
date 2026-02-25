import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Contact Manager';

  searchTerm = '';
  contacts: Contact[] = [];
  selectedContact: Contact | null = null;

  private storageKey = 'contactManager.contacts';

  constructor() {
    this.loadContacts();
  }

  get filteredContacts(): Contact[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      return this.contacts;
    }
    return this.contacts.filter((c) =>
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.email ?? '').toLowerCase().includes(term)
    );
  }

  newContact() {
    this.selectedContact = {
      id: this.generateId(),
      name: '',
      phone: '',
      email: ''
    };
  }

  editContact(contact: Contact) {
    // Clone to avoid mutating the list until save
    this.selectedContact = { ...contact };
  }

  deleteContact(contact: Contact) {
    if (!confirm(`Delete contact "${contact.name}"?`)) {
      return;
    }
    this.contacts = this.contacts.filter((c) => c.id !== contact.id);
    if (this.selectedContact && this.selectedContact.id === contact.id) {
      this.selectedContact = null;
    }
    this.saveContacts();
  }

  saveSelectedContact() {
    if (!this.selectedContact) {
      return;
    }

    const trimmedName = this.selectedContact.name.trim();
    const trimmedPhone = this.selectedContact.phone.trim();

    if (!trimmedName || !trimmedPhone) {
      alert('Name and phone are required.');
      return;
    }

    const existingIndex = this.contacts.findIndex(
      (c) => c.id === this.selectedContact!.id
    );

    const normalized: Contact = {
      ...this.selectedContact,
      name: trimmedName,
      phone: trimmedPhone,
      email: this.selectedContact.email?.trim() || ''
    };

    if (existingIndex >= 0) {
      const updated = [...this.contacts];
      updated[existingIndex] = normalized;
      this.contacts = updated;
    } else {
      this.contacts = [...this.contacts, normalized];
    }

    this.saveContacts();
    this.selectedContact = null;
  }

  cancelEdit() {
    this.selectedContact = null;
  }

  private generateId(): number {
    return this.contacts.length
      ? Math.max(...this.contacts.map((c) => c.id)) + 1
      : 1;
  }

  private loadContacts() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.contacts = JSON.parse(stored);
        return;
      } catch {
        // fall back to defaults below
      }
    }

    // Default contacts
    this.contacts = [
      {
        id: 1,
        name: 'Alice Johnson',
        phone: '+1 555-123-4567',
        email: 'alice@example.com'
      },
      {
        id: 2,
        name: 'Bob Smith',
        phone: '+1 555-987-6543',
        email: 'bob@example.com'
      },
      {
        id: 3,
        name: 'Charlie Brown',
        phone: '+1 555-222-3333',
        email: 'charlie@example.com'
      }
    ];

    this.saveContacts();
  }

  private saveContacts() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
  }
}
