import { Component, signal, OnInit } from '@angular/core';
import { GetProjects, CreateProject } from '../../../wailsjs/go/main/App';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      
      <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h2>
          <p class="text-slate-500 dark:text-slate-400 mt-1">Manage your CheckMate projects</p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Create New Project</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">A project is a logical grouping of one or more repositories that share the same security policies and are scanned together.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project Name</label>
            <input type="text" [(ngModel)]="newProjectName" placeholder="e.g. Core Backend Services" class="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors">
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-2">A human-friendly name for this project.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Workspace</label>
            <input type="text" [(ngModel)]="newProjectWorkspace" placeholder="e.g. Engineering" class="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors">
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-2">Optional. Use workspaces to group related projects together (like a team name or department).</p>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button (click)="createProject()" [disabled]="!newProjectName" class="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Project
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Project Name</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Workspace</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Last Scanned</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            @for (proj of projects(); track proj.ID) {
              <tr (click)="goToProject(proj.ID)" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{{ proj.Name }}</td>
                <td class="px-6 py-4 text-slate-500 dark:text-slate-400">{{ proj.Workspace }}</td>
                <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                  @if (proj.LastScan && !proj.LastScan.startsWith('0001-01-01')) {
                    {{ proj.LastScan | date:'medium' }}
                  } @else {
                    Never
                  }
                </td>
                <td class="px-6 py-4 text-right">
                  <a [routerLink]="['/projects', proj.ID]" class="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium transition-colors">Manage &rarr;</a>
                </td>
              </tr>
            }
            @empty {
              <tr>
                <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No projects found. Create one above.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class ProjectsComponent implements OnInit {
  projects = signal<any[]>([]);
  newProjectName = '';
  newProjectWorkspace = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchProjects();
  }

  fetchProjects(retries = 3) {
    try {
      GetProjects().then((data: any) => {
        this.projects.set(data || []);
      }).catch(err => {
        console.warn("Failed to fetch projects", err);
      });
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => this.fetchProjects(retries - 1), 200);
      } else {
        console.warn("Wails IPC not available. Are you viewing in a standard browser?");
      }
    }
  }

  goToProject(id: string) {
    this.router.navigate(['/projects', id]);
  }

  createProject() {
    if (!this.newProjectName) return;
    
    try {
      CreateProject(this.newProjectName, this.newProjectWorkspace).then(() => {
        this.newProjectName = '';
        this.newProjectWorkspace = '';
        this.fetchProjects(); // Refresh the list
      }).catch(err => {
        alert("Error creating project: " + err);
      });
    } catch (e: any) {
      alert("Wails IPC is not available. Please ensure you are viewing this app within the CheckMate Desktop App, not a standard browser. Error: " + e.message);
    }
  }
}
