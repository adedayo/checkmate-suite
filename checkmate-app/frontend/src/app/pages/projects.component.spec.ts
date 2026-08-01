import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectsComponent } from './projects.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { vi, MockInstance } from 'vitest';

import * as WailsApp from '../../../wailsjs/go/main/App';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let getProjectsSpy: MockInstance;
  let createProjectSpy: MockInstance;

  beforeEach(async () => {
    getProjectsSpy = vi.fn().mockResolvedValue([
      { ID: '1', Name: 'Test Project 1', Workspace: 'W1', LastScan: '2023-01-01' } as any,
      { ID: '2', Name: 'Test Project 2', Workspace: 'W2', LastScan: '2023-01-02' } as any
    ]);
    createProjectSpy = vi.fn().mockResolvedValue({
      ID: '3', Name: 'New', Workspace: 'NewW', LastScan: ''
    } as any);

    (window as any).go = {
      main: {
        App: {
          GetProjects: getProjectsSpy,
          CreateProject: createProjectSpy
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), FormsModule, ProjectsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
  });

  it('should create and load projects', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.projects().length).toBe(2);
    expect(getProjectsSpy).toHaveBeenCalled();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Project 1');
  });

  it('should create a project and refresh the list', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    // Set form fields
    component.newProjectName = 'New Project';
    component.newProjectWorkspace = 'Engineering';
    
    // Trigger creation
    component.createProject();
    await fixture.whenStable();
    
    expect(createProjectSpy).toHaveBeenCalledWith('New Project', 'Engineering');
    // Ensure it re-fetches after creation
    expect(getProjectsSpy).toHaveBeenCalledTimes(2); 
    expect(component.newProjectName).toBe('');
  });
});
