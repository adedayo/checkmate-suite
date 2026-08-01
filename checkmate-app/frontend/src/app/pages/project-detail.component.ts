import { Component, signal, computed, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GetProjects, AddRepository, RemoveRepository, StartScan, GetProjectFindings, SuppressFinding, GetExceptions, RemoveException, ExportExceptions, ImportExceptions, GetProjectScanHistory, DeleteProjectScans, SelectDirectory, UpdateProjectDetails } from '../../../wailsjs/go/main/App';
import { EventsOn, EventsOff } from '../../../wailsjs/runtime/runtime';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, FormsModule, CommonModule, NgxChartsModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <a routerLink="/projects" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </a>
        <div class="flex-1">
          @if (isEditing()) {
            <div class="flex flex-col gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Project Name</label>
                <input type="text" [(ngModel)]="editName" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Workspace</label>
                <input type="text" list="workspaces" [(ngModel)]="editWorkspace" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow">
                <datalist id="workspaces">
                  @for (ws of availableWorkspaces(); track ws) {
                    <option [value]="ws"></option>
                  }
                </datalist>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Description (Optional)</label>
                <input type="text" [(ngModel)]="editDescription" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow">
              </div>
              <div class="flex gap-2 mt-1">
                <button (click)="saveDetails()" class="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded shadow-sm transition-colors">Save</button>
                <button (click)="cancelEdit()" class="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded transition-colors">Cancel</button>
              </div>
            </div>
          } @else {
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ project()?.Name || 'Loading...' }}</h2>
              <button (click)="startEdit()" class="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" title="Edit Project Details">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
            </div>
            <p class="text-slate-500 dark:text-slate-400 mt-1 font-mono text-sm flex gap-4">
              <span>Workspace: {{ project()?.Workspace || 'N/A' }}</span>
              <span>Last Scan: 
              @if (project()?.LastScan && !project()?.LastScan.startsWith('0001-01-01')) {
                {{ project()?.LastScan | date:'medium' }}
              } @else {
                Never
              }
              </span>
            </p>
            @if (project()?.Description) {
              <p class="text-slate-600 dark:text-slate-300 mt-2 text-sm max-w-2xl">{{ project()?.Description }}</p>
            }
          }
        </div>
        <button (click)="runScan()" [disabled]="scanning()" class="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
          @if (scanning()) {
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Scanning...
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Scan
          }
        </button>
      </div>

      <!-- Trawl-style Tabs -->
      <div class="flex space-x-6 border-b border-slate-200 dark:border-slate-800">
        <button (click)="activeTab.set('overview')" [class]="activeTab() === 'overview' ? 'border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 font-semibold border-b-2' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-b-2'" class="py-3 px-1 text-xs uppercase tracking-wider transition">
          Overview
        </button>
        <button (click)="activeTab.set('trends'); loadTrends()" [class]="activeTab() === 'trends' ? 'border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 font-semibold border-b-2' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-b-2'" class="py-3 px-1 text-xs uppercase tracking-wider transition">
          Trends
        </button>
        <button (click)="activeTab.set('vulnerabilities')" [class]="activeTab() === 'vulnerabilities' ? 'border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 font-semibold border-b-2' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-b-2'" class="py-3 px-1 text-xs uppercase tracking-wider transition flex items-center space-x-1.5">
          <span>Vulnerabilities</span>
          @if (activeFindings().length > 0) {
            <span class="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-bold">{{ activeFindings().length }}</span>
          }
        </button>
        <button (click)="activeTab.set('exceptions'); loadExceptions()" [class]="activeTab() === 'exceptions' ? 'border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 font-semibold border-b-2' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-b-2'" class="py-3 px-1 text-xs uppercase tracking-wider transition flex items-center space-x-1.5">
          <span>Exceptions</span>
        </button>
      </div>

      <!-- Overview Tab -->
      @if (activeTab() === 'overview') {
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Add Repository</h3>
          <div class="flex gap-4">
            <input type="text" [(ngModel)]="newRepoLocation" placeholder="Path to local repo or Git URL (e.g. https://github.com/org/repo.git)" class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <button (click)="browseDirectory()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap">Browse Local Filesystem...</button>
            <button (click)="addRepository()" class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 font-medium transition-colors shadow-sm">Add</button>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Repository Location</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (repo of project()?.Repositories || []; track repo.Location) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 font-mono text-sm break-all">{{ repo.Location }}</td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="removeRepository(repo.Location)" class="text-rose-500 hover:text-rose-700 transition-colors p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30" title="Remove Repository">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="2" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No repositories added yet.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Vulnerabilities Tab -->
      @if (activeTab() === 'vulnerabilities') {
        
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-2">
            @if (selectedHistoricalScanID() || selectedSeverityFilter()) {
              <div class="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-center justify-between shadow-sm flex-1">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600 dark:text-indigo-400"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  <span class="text-sm text-indigo-800 dark:text-indigo-300">
                    Viewing filtered results
                    @if (selectedHistoricalScanID()) { for historical scan }
                    @if (selectedSeverityFilter()) { (Severity: <strong>{{selectedSeverityFilter()}}</strong>) }
                  </span>
                </div>
                <button (click)="selectedHistoricalScanID.set(''); selectedSeverityFilter.set(''); fetchFindings(project().ID)" class="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-indigo-200 dark:border-indigo-700 ml-4">
                  Clear Filter
                </button>
              </div>
            }
          </div>
          
          <div class="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <select [ngModel]="selectedSeverityFilter()" (ngModelChange)="selectedSeverityFilter.set($event)" class="text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 font-medium cursor-pointer appearance-none pr-4">
              <option value="">All Criticalities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Info">Info</option>
            </select>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Location</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Details</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Criticality</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Confidence</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (finding of activeFindings(); track $index) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" (click)="selectFinding(finding)">
                  <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                    <div class="font-mono text-cyan-600 dark:text-cyan-400 font-semibold" [class.line-through]="finding.Excluded">
                      {{ finding.location || finding.Location || 'Unknown File' }}
                    </div>
                    @if (finding.range?.start?.line !== undefined || finding.Range?.Start?.Line !== undefined) {
                      <div class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Line: {{ (finding.range?.start?.line ?? finding.Range?.Start?.Line ?? 0) + 1 }}
                      </div>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <div class="font-semibold text-slate-900 dark:text-slate-100">
                      {{ finding.justification?.headline?.description || finding.Justification?.Headline?.Description || finding.providerID || finding.ProviderID || 'Potential Secret / Vulnerability' }}
                    </div>
                    @if (finding.source || finding.Source) {
                      <div class="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-xl">
                        {{ finding.source || finding.Source }}
                      </div>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold border"
                          [ngClass]="{
                            'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900': (finding.severity || finding.Severity)?.toLowerCase() === 'critical',
                            'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900': (finding.severity || finding.Severity)?.toLowerCase() === 'high',
                            'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900': (finding.severity || finding.Severity)?.toLowerCase() === 'medium',
                            'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900': (finding.severity || finding.Severity)?.toLowerCase() === 'low',
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700': !(finding.severity || finding.Severity) || (finding.severity || finding.Severity)?.toLowerCase() === 'info'
                          }">
                      {{ finding.severity || finding.Severity || 'Info' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {{ finding.justification?.headline?.confidence || finding.Justification?.Headline?.Confidence || 'High' }}
                    </span>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="3" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    @if ((project()?.Repositories || []).length === 0) {
                      No repositories added to this project yet. Add a local directory path or Git URL above and click <strong>Add</strong>, then run a scan!
                    } @else {
                      No vulnerabilities found in the latest scan!
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }


      <!-- Trends Tab -->
      @if (activeTab() === 'trends') {
        <div class="space-y-6">
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Vulnerability Trends Over Time</h3>
              <button (click)="clearHistory()" class="px-4 py-2 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 font-medium transition-colors text-sm">Clear History</button>
            </div>
            <div class="h-80 w-full overflow-hidden flex items-center justify-center">
              @if (scanHistory().length > 1) {
                <ngx-charts-line-chart
                  [scheme]="'cool'"
                  [results]="trendChartData()"
                  [gradient]="false"
                  [xAxis]="true"
                  [yAxis]="true"
                  [legend]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  xAxisLabel="Scans (Timeline)"
                  yAxisLabel="Findings Count"
                  [autoScale]="true"
                  [showGridLines]="false"
                  (select)="onChartSelect($event)"
                  (legendLabelClick)="onLegendClick($event)">
                </ngx-charts-line-chart>
              } @else if (scanHistory().length === 1) {
                <div class="text-slate-500 dark:text-slate-400 text-center flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  <p>Run another scan to see trends over time.</p>
                </div>
              } @else {
                <div class="text-slate-500 dark:text-slate-400 text-center flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  <p>No historical scans found. Run a scan to see data!</p>
                </div>
              }
            </div>
            @if (scanHistory().length > 1) {
              <p class="text-xs text-slate-500 mt-4">Click any data point to view findings from that historical scan.</p>
            }
          </div>
          
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Latest Scan Breakdown</h3>
            <div class="h-64 w-full overflow-hidden flex items-center justify-center">
              @if (scanHistory().length > 0) {
                <ngx-charts-bar-vertical
                  [scheme]="'cool'"
                  [results]="barChartData()"
                  [gradient]="false"
                  [xAxis]="true"
                  [yAxis]="true"
                  [legend]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [showGridLines]="false"
                  [customColors]="barChartColors"
                  xAxisLabel="Severity"
                  yAxisLabel="Count"
                  (select)="onBarChartSelect($event)">
                </ngx-charts-bar-vertical>
              } @else {
                <div class="text-slate-500 dark:text-slate-400 text-center">
                  <p>No data available for breakdown.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Exceptions Tab -->
      @if (activeTab() === 'exceptions') {
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Scan Exceptions</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm">Manage rules that filter out false positives natively during scans.</p>
          </div>
          <div class="flex gap-3">
            <button (click)="importExceptions()" class="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors text-sm">
              Import YAML
            </button>
            <button (click)="exportExceptions()" class="px-4 py-2 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg font-medium transition-colors text-sm shadow-sm">
              Export YAML
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Rule Match</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reason</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (exc of exceptions(); track exc.id) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                      {{ exc.scope?.type }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-mono">
                    {{ exc.scope?.secretChecksum || exc.scope?.stringMatch || exc.scope?.regexMatch || exc.scope?.path || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {{ exc.reason }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="removeException(exc.id)" class="text-rose-500 hover:text-rose-700 transition-colors p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30" title="Remove Exception">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No exceptions found for this project.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Drawer -->
      @if (selectedFinding()) {
        <div class="fixed inset-0 z-50 flex justify-end">
          <div class="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="selectedFinding.set(null)"></div>
          <div class="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800" style="animation: slideIn 0.2s ease-out forwards;">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Finding Details</h3>
              <button (click)="selectedFinding.set(null)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Location</div>
                <div class="font-mono text-sm text-cyan-600 dark:text-cyan-400 break-all">{{ selectedFinding().location || selectedFinding().Location || 'Unknown' }}</div>
                @if (selectedFinding().range?.start?.line !== undefined || selectedFinding().Range?.Start?.Line !== undefined) {
                  <div class="text-sm text-slate-600 dark:text-slate-300 mt-1">Line: {{ (selectedFinding().range?.start?.line ?? selectedFinding().Range?.Start?.Line ?? 0) + 1 }}</div>
                }
              </div>

              <div>
                <div class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Classification</div>
                <div class="flex items-center gap-3">
                  <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    {{ selectedFinding().justification?.headline?.confidence || selectedFinding().Justification?.Headline?.Confidence || 'High' }} Confidence
                  </span>
                  <span class="text-slate-700 dark:text-slate-300 font-medium">
                    {{ selectedFinding().justification?.headline?.description || selectedFinding().Justification?.Headline?.Description || selectedFinding().providerID || selectedFinding().ProviderID || 'Potential Secret / Vulnerability' }}
                  </span>
                </div>
              </div>

              @if (selectedFinding().source || selectedFinding().Source) {
                <div>
                  <div class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Code Context</div>
                  <pre class="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-sm font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap">{{ selectedFinding().source || selectedFinding().Source }}</pre>
                </div>
              }

              @if (reusedSecrets().length > 0) {
                <div>
                  <div class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Reused In Other Files</div>
                  <div class="space-y-2">
                    @for (reused of reusedSecrets(); track $index) {
                      <div class="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" (click)="selectFinding(reused)">
                        <svg class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <div class="flex-1">
                          <div class="text-sm font-mono text-cyan-600 dark:text-cyan-400 break-all">{{ reused.location || reused.Location || 'Unknown' }}</div>
                          @if (reused.range?.start?.line !== undefined || reused.Range?.Start?.Line !== undefined) {
                            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Line: {{ (reused.range?.start?.line ?? reused.Range?.Start?.Line ?? 0) + 1 }}</div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
              
              @if (selectedFinding().Excluded) {
                <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-3">
                  <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  <div>
                    <div class="font-semibold text-emerald-800 dark:text-emerald-300">Suppressed as False Positive</div>
                    <div class="text-sm text-emerald-600 dark:text-emerald-400 mt-1">This finding is ignored in reports.</div>
                  </div>
                </div>
              } @else {
                <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Manage Exception</div>
                  
                  <div class="space-y-4">
                    <div>
                      <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Scope Type</label>
                      <select [(ngModel)]="suppressScope" (change)="onScopeChange()" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option value="globalHash">Global Hash (Ignore Exact Secret Everywhere)</option>
                        <option value="globalString">Global String (Ignore Exact Text Everywhere)</option>
                        <option value="globalRegex">Global Regex (Ignore Text Matching Regex Everywhere)</option>
                        <option value="pathRegex">Path Regex (Ignore all secrets in files matching regex)</option>
                        <option value="pathString">Path + String (Ignore exact text in this specific file)</option>
                        <option value="pathHash">Path + Hash (Ignore exact secret in this specific file)</option>
                        <option value="pathRegexRegex">Path + Regex (Ignore text matching regex in this specific file)</option>
                      </select>
                    </div>

                    @if (suppressScope().startsWith('path') && suppressScope() !== 'pathRegex') {
                      <div>
                        <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">File Path</label>
                        <input type="text" [(ngModel)]="suppressPath" class="w-full px-3 py-2 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      </div>
                    }

                    <div>
                      <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Match Pattern / String / Hash</label>
                      <textarea [(ngModel)]="suppressMatch" rows="2" class="w-full px-3 py-2 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
                    </div>

                    <div>
                      <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Reason for suppression</label>
                      <input type="text" [(ngModel)]="suppressReason" placeholder="e.g., Test credential, False positive" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    </div>

                    <div class="flex justify-end pt-2">
                      <button (click)="suppressSelected()" [disabled]="suppressing() || !suppressReason() || !suppressMatch()" class="px-6 py-2 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white disabled:opacity-50 text-white dark:text-slate-900 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap">
                        {{ suppressing() ? 'Suppressing...' : 'Mark as False Positive' }}
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class ProjectDetailComponent implements OnInit {
  project = signal<any>(null);
  findings = signal<any[]>([]);
  newRepoLocation = '';
  scanning = signal(false);
  activeTab = signal<'overview' | 'vulnerabilities' | 'exceptions' | 'trends'>('overview');

  exceptions = signal<any[]>([]);
  
  // Edit State
  isEditing = signal<boolean>(false);
  editName = '';
  editWorkspace = '';
  editDescription = '';
  availableWorkspaces = signal<string[]>([]);
  
  // Trends state
  scanHistory = signal<any[]>([]);
  trendChartData = signal<any[]>([]);
  barChartData = signal<any[]>([]);
  selectedHistoricalScanID = signal<string>('');
  selectedSeverityFilter = signal<string>('');
  
  barChartColors = [
    { name: 'Critical', value: '#e11d48' },
    { name: 'CRITICAL', value: '#e11d48' },
    { name: 'High', value: '#f97316' },
    { name: 'HIGH', value: '#f97316' },
    { name: 'Medium', value: '#eab308' },
    { name: 'MEDIUM', value: '#eab308' },
    { name: 'Low', value: '#3b82f6' },
    { name: 'LOW', value: '#3b82f6' },
    { name: 'Info', value: '#94a3b8' },
    { name: 'INFO', value: '#94a3b8' }
  ];

  selectedFinding = signal<any>(null);
  suppressReason = signal<string>('');
  suppressScope = signal<string>('globalHash');
  suppressMatch = signal<string>('');
  suppressPath = signal<string>('');
  suppressing = signal(false);

  activeFindings = computed(() => {
    let list = this.findings().filter(f => !f.Excluded && !f.excluded);
    const severity = this.selectedSeverityFilter();
    if (severity) {
      list = list.filter(f => {
        const sev = f.severity || f.Severity || (f.justification?.headline?.confidence || f.Justification?.Headline?.Confidence || '');
        return sev.toLowerCase() === severity.toLowerCase();
      });
    }
    return list;
  });

  reusedSecrets = computed(() => {
    const selected = this.selectedFinding();
    if (!selected) return [];
    const selectedHash = selected.sha256 || selected.SHA256;
    if (!selectedHash) return [];
    return this.findings().filter(f => {
      const fHash = f.sha256 || f.SHA256;
      return fHash === selectedHash && f !== selected;
    });
  });

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    EventsOn("scan-finding", (finding: any) => {
      this.findings.update(f => [...f, finding]);
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProject(id);
      }
    });
  }

  fetchProject(id: string, retries = 3) {
    try {
      GetProjects().then((data: any) => {
        const proj = data.find((p: any) => p.ID === id);
        if (proj) {
          this.project.set(proj);
          this.fetchFindings(id);
          this.loadExceptions();
        }
      });
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => this.fetchProject(id, retries - 1), 200);
      } else {
        console.warn("Wails IPC not available. Are you viewing in a standard browser?");
      }
    }
  }

  fetchFindings(projID: string, scanID: string = '') {
    GetProjectFindings(projID, scanID).then(findings => {
      this.findings.set(findings || []);
    });
  }

  loadTrends() {
    const proj = this.project();
    if (!proj) return;
    
    GetProjectScanHistory(proj.ID, 30).then((history: any) => {
      if (!history) {
        history = [];
      }
      this.scanHistory.set(history);
      
      if (history.length === 0) {
        this.trendChartData.set([]);
        this.barChartData.set([]);
        return;
      }
      
      // Build line chart data: Reverse so oldest is first
      const revHistory = [...history].reverse();
      
      const totalSeries = { name: 'Total Issues', series: [] as any[] };
      const critSeries = { name: 'Critical', series: [] as any[] };
      const highSeries = { name: 'High', series: [] as any[] };
      
      const seenNames = new Map<string, number>();
      revHistory.forEach((scan: any, index: number) => {
        const d = new Date(scan.StartedAt || scan.Metrics?.StartedAt);
        let name: string;
        if (isNaN(d.getTime())) {
          name = 'Scan ' + (index + 1);
        } else {
          name = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        // Ensure unique names for ngx-charts (it merges data points with identical names)
        const count = seenNames.get(name) || 0;
        seenNames.set(name, count + 1);
        if (count > 0) {
          name = name + ' #' + (count + 1);
        }
        totalSeries.series.push({ name, value: scan.Metrics?.totalFindings || 0, extra: { scanID: scan.ID } });
        
        let crit = 0; let high = 0;
        if (scan.Metrics?.findingsBySeverity) {
          crit = scan.Metrics.findingsBySeverity['Critical'] || scan.Metrics.findingsBySeverity['CRITICAL'] || 0;
          high = scan.Metrics.findingsBySeverity['High'] || scan.Metrics.findingsBySeverity['HIGH'] || 0;
        }
        critSeries.series.push({ name, value: crit, extra: { scanID: scan.ID } });
        highSeries.series.push({ name, value: high, extra: { scanID: scan.ID } });
      });
      
      this.trendChartData.set([totalSeries, critSeries, highSeries]);
      
      // Build bar chart for the latest scan (or selected)
      const barData = [];
      if (history.length > 0) {
        const latest = history[0];
        if (latest.Metrics?.findingsBySeverity) {
           for (const [key, val] of Object.entries(latest.Metrics.findingsBySeverity)) {
             barData.push({ name: key, value: val, extra: { scanID: latest.ID } });
           }
        }
      }
      this.barChartData.set(barData);
    });
  }

  clearHistory() {
    const proj = this.project();
    if (!proj) return;
    
    if (confirm('Are you sure you want to clear all historical scans? This cannot be undone.')) {
      DeleteProjectScans(proj.ID).then(() => {
        this.loadTrends();
      }).catch((err: any) => {
        alert("Error clearing history: " + err);
      });
    }
  }

  startEdit() {
    const proj = this.project();
    if (!proj) return;
    
    this.editName = proj.Name || '';
    this.editWorkspace = proj.Workspace || '';
    this.editDescription = proj.Description || '';
    
    GetProjects().then((workspaces: any) => {
      const wsSet = new Set<string>();
      if (workspaces && workspaces.Details) {
        Object.keys(workspaces.Details).forEach(ws => wsSet.add(ws));
      }
      this.availableWorkspaces.set(Array.from(wsSet));
      this.isEditing.set(true);
    }).catch(err => {
      console.error('Failed to load workspaces:', err);
      // Even if it fails, still allow editing
      this.isEditing.set(true);
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  saveDetails() {
    const proj = this.project();
    if (!proj) return;
    
    UpdateProjectDetails(proj.ID, this.editName, this.editWorkspace, this.editDescription).then((updated: any) => {
      this.project.set(updated);
      this.isEditing.set(false);
    }).catch((err: any) => {
      alert("Error saving project details: " + err);
    });
  }

  onChartSelect(event: any) {
    let scanID = '';
    let severity = '';
    
    if (event.extra && event.extra.scanID) {
      scanID = event.extra.scanID;
    }
    
    if (event.series && event.series !== 'Total Issues') {
      severity = event.series; 
    } else if (!event.series && event.name && event.name !== 'Total Issues') {
      severity = event.name;
    }

    this.selectedHistoricalScanID.set(scanID);
    this.selectedSeverityFilter.set(severity);
    
    if (scanID) {
      this.fetchFindings(this.project().ID, scanID);
    }
    this.activeTab.set('vulnerabilities');
  }

  onBarChartSelect(event: any) {
    const severity = event.name || '';
    const scanID = event.extra?.scanID || '';
    
    this.selectedSeverityFilter.set(severity);
    this.selectedHistoricalScanID.set(scanID);
    
    if (scanID) {
      this.fetchFindings(this.project().ID, scanID);
    }
    this.activeTab.set('vulnerabilities');
  }

  onLegendClick(event: any) {
    const legendLabel = typeof event === 'string' ? event : event?.name || event?.label || '';
    if (legendLabel && legendLabel !== 'Total Issues') {
      this.selectedSeverityFilter.set(legendLabel);
      this.activeTab.set('vulnerabilities');
    }
  }

  browseDirectory() {
    SelectDirectory().then((dir: any) => {
      if (dir) {
        this.newRepoLocation = dir;
        this.cdr.detectChanges();
      }
    }).catch((err: any) => console.error(err));
  }

  addRepository() {
    const proj = this.project();
    if (!proj || !this.newRepoLocation) return;
    
    AddRepository(proj.ID, this.newRepoLocation).then(updatedProj => {
      this.project.set(updatedProj);
      this.newRepoLocation = '';
    }).catch(err => alert("Error adding repo: " + err));
  }

  removeRepository(repoLocation: string) {
    const proj = this.project();
    if (!proj) return;
    
    RemoveRepository(proj.ID, repoLocation).then(updatedProj => {
      this.project.set(updatedProj);
    }).catch(err => alert("Error removing repo: " + err));
  }

  runScan() {
    const proj = this.project();
    if (!proj) return;

    this.findings.set([]);
    this.scanning.set(true);
    this.activeTab.set('vulnerabilities');

    StartScan(proj.ID).then(() => {
      this.scanning.set(false);
      this.fetchProject(proj.ID);
    }).catch(err => {
      alert("Error triggering scan: " + err);
      this.scanning.set(false);
    });
  }

  selectFinding(finding: any) {
    this.selectedFinding.set(finding);
    this.suppressReason.set('');
    this.suppressScope.set('globalHash');
    this.onScopeChange();
  }

  onScopeChange() {
    const finding = this.selectedFinding();
    if (!finding) return;

    const scope = this.suppressScope();
    const hash = finding.sha256 || finding.SHA256 || '';
    const source = finding.source || finding.Source || '';
    const loc = finding.location || finding.Location || '';

    this.suppressPath.set(loc);

    if (scope.includes('Hash')) {
      this.suppressMatch.set(hash);
    } else if (scope.includes('Regex')) {
      // Basic escape to make it a literal regex by default
      const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      this.suppressMatch.set(escaped);
    } else {
      this.suppressMatch.set(source);
    }
  }

  suppressSelected() {
    const finding = this.selectedFinding();
    const reason = this.suppressReason();
    const match = this.suppressMatch();
    const scope = this.suppressScope();
    const path = this.suppressPath();
    const projID = this.project()?.ID;

    if (!finding || !reason || !match || !projID) return;
    
    this.suppressing.set(true);

    const opts = {
      scopeType: scope,
      matchString: match,
      path: path,
      reason: reason
    };

    SuppressFinding(projID, finding, opts as any).then(() => {
      this.suppressing.set(false);
      finding.Excluded = true;
      this.selectedFinding.set(null); // Close the drawer
      
      this.fetchFindings(projID);
    }).catch(err => {
      alert("Error suppressing finding: " + err);
      this.suppressing.set(false);
    });
  }

  async loadExceptions() {
    const p = this.project();
    if (!p) return;
    try {
      const ex = await GetExceptions(p.ID);
      this.exceptions.set(ex || []);
    } catch (e) {
      console.error("Failed to load exceptions", e);
    }
  }

  async removeException(id: string) {
    if (!confirm("Are you sure you want to remove this exception? It will no longer filter issues on future scans.")) return;
    try {
      await RemoveException(id);
      await this.loadExceptions();
    } catch (e) {
      alert("Error removing exception: " + e);
    }
  }

  async exportExceptions() {
    const p = this.project();
    if (!p) return;
    try {
      await ExportExceptions(p.ID);
      // We don't need to alert on success if the save dialog handles it gracefully
    } catch (e) {
      alert("Error exporting exceptions: " + e);
    }
  }

  async importExceptions() {
    const p = this.project();
    if (!p) return;
    try {
      await ImportExceptions(p.ID);
      await this.loadExceptions();
    } catch (e) {
      alert("Error importing exceptions: " + e);
    }
  }
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.selectedFinding() && !this.suppressing() && this.suppressReason() && this.suppressMatch()) {
        this.suppressSelected();
      }
      return;
    }

    if (event.key === 'Escape') {
      if (this.selectedFinding()) {
        this.selectedFinding.set(null);
        event.preventDefault();
      }
      return;
    }

    if (isInput) return;

    if (this.activeTab() === 'vulnerabilities' && this.activeFindings().length > 0) {
      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        const current = this.selectedFinding();
        if (!current) {
          this.selectFinding(this.activeFindings()[0]);
        } else {
          const idx = this.activeFindings().indexOf(current);
          if (idx !== -1 && idx < this.activeFindings().length - 1) {
            this.selectFinding(this.activeFindings()[idx + 1]);
          }
        }
      } else if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        const current = this.selectedFinding();
        if (current) {
          const idx = this.activeFindings().indexOf(current);
          if (idx > 0) {
            this.selectFinding(this.activeFindings()[idx - 1]);
          }
        }
      }
    }
  }
}
