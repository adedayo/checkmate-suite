import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectDetailComponent } from './project-detail.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { vi, MockInstance } from 'vitest';

import * as WailsApp from '../../../wailsjs/go/main/App';

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let getProjectsSpy: MockInstance;
  let getFindingsSpy: MockInstance;
  let startScanSpy: MockInstance;

  beforeEach(async () => {
    getProjectsSpy = vi.fn().mockResolvedValue([
      { ID: '1', Name: 'Test Project 1', Workspace: 'W1', LastScan: '2023-01-01', Repositories: [{Location: "repo1"}] } as any
    ]);
    
    getFindingsSpy = vi.fn().mockResolvedValue([
      { Id: 'f1', Title: 'Secret Exposed', Location: { File: 'main.go', Line: 10 } } as any
    ]);

    startScanSpy = vi.fn().mockResolvedValue(undefined);

    (window as any).go = {
      main: {
        App: {
          GetProjects: getProjectsSpy,
          GetProjectFindings: getFindingsSpy,
          StartScan: startScanSpy,
          GetExceptions: vi.fn().mockResolvedValue([])
        }
      }
    };
    
    (window as any).runtime = {
      EventsOn: vi.fn(),
      EventsOff: vi.fn(),
      EventsOnMultiple: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), FormsModule, ProjectDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', '1']])) // mock the route param
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load project details and findings on init', async () => {
    fixture.detectChanges();
    // In Angular testing with fake timers, flush microtasks for promises
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(200);
    }
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(getProjectsSpy).toHaveBeenCalled();
    expect(getFindingsSpy).toHaveBeenCalledWith('1', '');
    expect(component.project()?.Name).toBe('Test Project 1');
    expect(component.findings().length).toBe(1);
  });

  it('should run a scan when requested', async () => {
    fixture.detectChanges();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(200);
    }

    component.runScan();
    // Resolve the StartScan promise
    await Promise.resolve();
    vi.advanceTimersByTime(2000); // simulate the timeout wait

    expect(startScanSpy).toHaveBeenCalledWith('1');
    expect(component.scanning()).toBe(false);
    expect(component.activeTab()).toBe('vulnerabilities');
  });
});
