import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClient, HttpHeaders } from '@angular/common/http'

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.css']
})
export class ProfilePage implements OnInit {

  user: any = {
    name: '',
    email: '',
    role: ''
  }

  message: string = ''

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProfile()
  }

  loadProfile() {

    const token = localStorage.getItem('token')

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    })

    this.http.get<any>('http://127.0.0.1:5000/api/profile', { headers })
      .subscribe({
        next: (data) => {
          this.user = data
        },
        error: (err) => {
          console.error(err)
        }
      })
  }

  updateProfile() {

    const token = localStorage.getItem('token')

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    })

    this.http.put(
      'http://127.0.0.1:5000/api/profile',
      {
        name: this.user.name,
        email: this.user.email
      },
      { headers }
    ).subscribe({
      next: () => {
        this.message = 'Perfil actualizado correctamente'
      },
      error: () => {
        this.message = 'Error al actualizar perfil'
      }
    })
  }
}