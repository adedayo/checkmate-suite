import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { GetAppVersion } from '../../wailsjs/go/main/App';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  theme = signal<'light' | 'dark'>('dark');
  version = signal<string>('v2.1.0-DEV');

  ngOnInit() {
    // Check local storage or system preference in a real app, defaulting to dark for Trawl feel
    this.applyTheme(this.theme());
    try {
      GetAppVersion().then(v => {
        if (v) this.version.set(v);
      }).catch(() => {});
    } catch (e) {}
  }

  toggleTheme() {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(newTheme);
    this.applyTheme(newTheme);
  }

  private applyTheme(theme: string) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
