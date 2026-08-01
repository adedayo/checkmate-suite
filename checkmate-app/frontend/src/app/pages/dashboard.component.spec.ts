import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { RouterModule } from '@angular/router';
import { vi } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    (window as any).go = {
      main: {
        App: {
          GetDashboardAnalytics: vi.fn().mockResolvedValue({
            score: 85,
            criticalFindings: 5,
            highFindings: 10,
            topRoiFixes: [],
            environments: { production: 0, nonProduction: 0 },
            secretCategories: [],
            projects: [],
            topReusedSecrets: [],
            trends: []
          }),
          GetAppVersion: vi.fn().mockResolvedValue('v2.1.0-TEST'),
          CheckForUpdates: vi.fn().mockResolvedValue({ available: false })
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), DashboardComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load analytics and version on init', async () => {
    fixture.detectChanges(); // triggers ngOnInit
    await fixture.whenStable(); // resolve promises
    fixture.detectChanges(); // update view
    
    // Verify the signals were updated
    expect(component.rawAnalytics()?.score).toBe(85);
    expect(component.appVersion()).toBe('v2.1.0-TEST');
  });
});
