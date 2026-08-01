package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/adedayo/checkmate/pkg/core/diagnostics"
	"github.com/adedayo/checkmate/pkg/core/projects"
	"github.com/adedayo/checkmate/pkg/gitservice/utils"
	secrets "github.com/adedayo/checkmate/pkg/plugin/secrets-finder/pkg"
	"github.com/adedayo/checkmate/pkg/store"
	"github.com/adedayo/checkmate/pkg/store/sqlite"
	"github.com/google/uuid"
	"github.com/mitchellh/go-homedir"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

var AppVersion = "v2.1.0-DEV"

// App struct
type App struct {
	ctx   context.Context
	store store.PlatformStore
}

// GetAppVersion returns the current runtime version of the CheckMate application.
// Can be injected at build time via -ldflags "-X main.AppVersion=v2.1.0"
func (a *App) GetAppVersion() string {
	return AppVersion
}

type UpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes"`
	DownloadURL    string `json:"downloadUrl"`
	HTMLURL        string `json:"htmlUrl"`
	PublishedAt    string `json:"publishedAt"`
}

type githubRelease struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	HTMLURL     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
	Assets      []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

// CheckForUpdates checks GitHub Releases API for newer checkmate-app releases
func (a *App) CheckForUpdates() (*UpdateInfo, error) {
	info := &UpdateInfo{
		Available:      false,
		CurrentVersion: AppVersion,
		LatestVersion:  AppVersion,
		HTMLURL:        "https://github.com/adedayo/checkmate-app/releases",
	}

	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest("GET", "https://api.github.com/repos/adedayo/checkmate-app/releases/latest", nil)
	if err != nil {
		return info, nil
	}
	req.Header.Set("User-Agent", "CheckMate-App/"+AppVersion)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			resp.Body.Close()
		}
		return info, nil
	}
	defer resp.Body.Close()

	var rel githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return info, nil
	}

	info.LatestVersion = rel.TagName
	info.ReleaseNotes = rel.Body
	info.HTMLURL = rel.HTMLURL
	info.PublishedAt = rel.PublishedAt

	if len(rel.Assets) > 0 {
		info.DownloadURL = rel.Assets[0].BrowserDownloadURL
	} else {
		info.DownloadURL = rel.HTMLURL
	}

	// Compare tag_name vs AppVersion
	cleanTag := strings.TrimPrefix(rel.TagName, "v")
	cleanCurrent := strings.TrimPrefix(AppVersion, "v")
	cleanCurrent = strings.TrimSuffix(cleanCurrent, "-DEV")

	if cleanTag != "" && cleanTag != cleanCurrent {
		info.Available = true
	}

	return info, nil
}

// NewApp creates a new App application struct
func NewApp() *App {
	app := &App{}
	
	// Initialize CheckMate SQLite store
	cmDataPath, err := homedir.Expand("~/.checkmate")
	if err != nil {
		log.Printf("Error expanding home dir: %v", err)
	} else {
		pm, err := sqlite.New(cmDataPath)
		if err != nil {
			log.Printf("Error initializing sqlite store: %v", err)
		} else {
			app.store = pm
		}
	}
	
	return app
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type WorkspaceMetrics struct {
	WorkspaceName      string `json:"workspaceName"`
	ProjectCount       int    `json:"projectCount"`
	TotalFindings      int    `json:"totalFindings"`
	CriticalCount      int    `json:"criticalCount"`
	HighCount          int    `json:"highCount"`
	MediumCount        int    `json:"mediumCount"`
	LowCount           int    `json:"lowCount"`
	ProductionLeaks    int    `json:"productionLeaks"`
	NonProductionLeaks int    `json:"nonProductionLeaks"`
	SecurityScore      int    `json:"securityScore"`
}

type ReusedSecretInsight struct {
	Checksum     string   `json:"checksum"`
	SecretType   string   `json:"secretType"`
	Occurrences  int      `json:"occurrences"`
	ProjectIDs   []string `json:"projectIds"`
	ProjectNames []string `json:"projectNames"`
	Workspaces   []string `json:"workspaces"`
	SamplePath   string   `json:"samplePath"`
	Severity     string   `json:"severity"`
}

type ROIFixRecommendation struct {
	ID              string  `json:"id"`
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	ImpactCount     int     `json:"impactCount"`
	ImpactPercent   float64 `json:"impactPercent"`
	Category        string  `json:"category"` // "ReusedSecret", "ProductionLeak", "HotspotFile"
	TargetProjectID string  `json:"targetProjectId"`
	TargetScanID    string  `json:"targetScanId"`
	TargetFile      string  `json:"targetFile,omitempty"`
	Checksum        string  `json:"checksum,omitempty"`
}

type CategoryDistribution struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

type ProjectExposure struct {
	ProjectID     string `json:"projectId"`
	ProjectName   string `json:"projectName"`
	Workspace     string `json:"workspace"`
	TotalFindings int    `json:"totalFindings"`
	CriticalCount int    `json:"criticalCount"`
	HighCount     int    `json:"highCount"`
	MediumCount   int    `json:"mediumCount"`
	LowCount      int    `json:"lowCount"`
	ProdLeaks     int    `json:"prodLeaks"`
	NonProdLeaks  int    `json:"nonProdLeaks"`
	SecurityScore int    `json:"securityScore"`
	LastScanDate  string `json:"lastScanDate"`
}

type DashboardTrendPoint struct {
	Date     string `json:"date"`
	Total    int    `json:"total"`
	Critical int    `json:"critical"`
	High     int    `json:"high"`
	Medium   int    `json:"medium"`
	Low      int    `json:"low"`
}

type DashboardAnalytics struct {
	TotalWorkspaces      int                    `json:"totalWorkspaces"`
	TotalProjects        int                    `json:"totalProjects"`
	TotalFindings        int                    `json:"totalFindings"`
	CriticalFindings     int                    `json:"criticalFindings"`
	HighFindings         int                    `json:"highFindings"`
	MediumFindings       int                    `json:"mediumFindings"`
	LowFindings          int                    `json:"lowFindings"`
	ExcludedFindings     int                    `json:"excludedFindings"`
	ProductionLeaks      int                    `json:"productionLeaks"`
	NonProductionLeaks   int                    `json:"nonProductionLeaks"`
	UniqueSecretsCount   int                    `json:"uniqueSecretsCount"`
	ReusedSecretsCount   int                    `json:"reusedSecretsCount"`
	ReusedSecretLeaks    int                    `json:"reusedSecretLeaks"`
	OverallSecurityScore int                    `json:"overallSecurityScore"`
	WorkspaceBreakdown   []WorkspaceMetrics     `json:"workspaceBreakdown"`
	ProjectBreakdown     []ProjectExposure      `json:"projectBreakdown"`
	TopReusedSecrets     []ReusedSecretInsight  `json:"topReusedSecrets"`
	TopROIFixes          []ROIFixRecommendation `json:"topRoiFixes"`
	SecretCategories     []CategoryDistribution `json:"secretCategories"`
	Trends               []DashboardTrendPoint  `json:"trends"`
}

type Metrics struct {
	CriticalFindings int    `json:"criticalFindings"`
	ProjectsScanned  int    `json:"projectsScanned"`
	SecurityScore    string `json:"securityScore"`
}

// isNonProdPath returns true if the file path indicates a test/spec/fixture/sample/doc environment
func isNonProdPath(path string) bool {
	lpath := strings.ToLower(path)
	nonProdKeywords := []string{
		"/test/", "/tests/", "_test.go", ".spec.ts", ".spec.js", ".test.ts", ".test.js",
		"/spec/", "/specs/", "/fixture/", "/fixtures/", "testdata", "mock", "stub",
		".sample", ".example", "docs/", "doc/", "example/", "examples/",
	}
	for _, kw := range nonProdKeywords {
		if strings.Contains(lpath, kw) {
			return true
		}
	}
	return false
}

// GetDashboardAnalytics aggregates posture insights across workspaces and projects
func (a *App) GetDashboardAnalytics() (*DashboardAnalytics, error) {
	analytics := &DashboardAnalytics{
		WorkspaceBreakdown: []WorkspaceMetrics{},
		ProjectBreakdown:   []ProjectExposure{},
		TopReusedSecrets:   []ReusedSecretInsight{},
		TopROIFixes:        []ROIFixRecommendation{},
		SecretCategories:   []CategoryDistribution{},
		Trends:             []DashboardTrendPoint{},
	}

	if a.store == nil {
		return analytics, nil
	}

	summaries := a.store.ListProjectSummaries()
	analytics.TotalProjects = len(summaries)

	workspacesMap := make(map[string]*WorkspaceMetrics)
	categoryMap := make(map[string]int)

	type secretTracker struct {
		checksum     string
		secretType   string
		occurrences  int
		projectsMap  map[string]string // id -> name
		workspaceMap map[string]bool
		samplePath   string
		severity     string
	}
	secretTrackerMap := make(map[string]*secretTracker)

	type fileHotspot struct {
		projectID   string
		projectName string
		filePath    string
		count       int
		criticals   int
	}
	fileHotspotMap := make(map[string]*fileHotspot)

	trendMap := make(map[string]*DashboardTrendPoint) // date -> trend

	totalWeight := 0
	projectCountWithScans := 0

	for _, smry := range summaries {
		if smry == nil {
			continue
		}
		wsName := smry.Workspace
		if wsName == "" {
			wsName = "Default Workspace"
		}

		wsMetrics, exists := workspacesMap[wsName]
		if !exists {
			wsMetrics = &WorkspaceMetrics{
				WorkspaceName: wsName,
				SecurityScore: 100,
			}
			workspacesMap[wsName] = wsMetrics
		}
		wsMetrics.ProjectCount++

		// Get project findings
		findings, err := a.GetProjectFindings(smry.ID, "")
		if err != nil {
			continue
		}

		lastScanStr := ""
		if !smry.LastScan.IsZero() {
			lastScanStr = smry.LastScan.Format(time.RFC3339)
		}

		projExp := ProjectExposure{
			ProjectID:     smry.ID,
			ProjectName:   smry.Name,
			Workspace:     wsName,
			LastScanDate:  lastScanStr,
			SecurityScore: 100,
		}

		projCrit, projHigh, projMed, projLow := 0, 0, 0, 0
		projProd, projNonProd := 0, 0

		for _, diag := range findings {
			if diag == nil {
				continue
			}
			if diag.Excluded {
				analytics.ExcludedFindings++
				continue
			}

			analytics.TotalFindings++
			projExp.TotalFindings++
			wsMetrics.TotalFindings++

			sevStr := diag.Justification.Headline.Confidence.String()
			switch sevStr {
			case "Critical":
				analytics.CriticalFindings++
				projCrit++
				wsMetrics.CriticalCount++
			case "High":
				analytics.HighFindings++
				projHigh++
				wsMetrics.HighCount++
			case "Medium":
				analytics.MediumFindings++
				projMed++
				wsMetrics.MediumCount++
			default:
				analytics.LowFindings++
				projLow++
				wsMetrics.LowCount++
			}

			// Category tracking
			catName := "Generic Secret"
			if diag.ProviderID != nil && *diag.ProviderID != "" {
				catName = *diag.ProviderID
			} else if diag.Justification.Headline.Description != "" {
				catName = diag.Justification.Headline.Description
			}
			categoryMap[catName]++

			// Production vs Non-Production leak tracking
			loc := ""
			if diag.Location != nil {
				loc = *diag.Location
			}
			isNonProd := diag.HasTag("test") || isNonProdPath(loc)
			if isNonProd {
				analytics.NonProductionLeaks++
				projNonProd++
				wsMetrics.NonProductionLeaks++
			} else {
				analytics.ProductionLeaks++
				projProd++
				wsMetrics.ProductionLeaks++
			}

			// File hotspot tracking
			if loc != "" {
				hotKey := smry.ID + ":" + loc
				spot, exists := fileHotspotMap[hotKey]
				if !exists {
					spot = &fileHotspot{
						projectID:   smry.ID,
						projectName: smry.Name,
						filePath:    loc,
					}
					fileHotspotMap[hotKey] = spot
				}
				spot.count++
				if sevStr == "Critical" || sevStr == "High" {
					spot.criticals++
				}
			}

			// Secret Deduplication / Reuse tracking
			checksum := ""
			if diag.SHA256 != nil && *diag.SHA256 != "" {
				checksum = *diag.SHA256
			} else if diag.Source != nil && *diag.Source != "" {
				checksum = *diag.Source
			}

			if checksum != "" {
				tracker, exists := secretTrackerMap[checksum]
				if !exists {
					tracker = &secretTracker{
						checksum:     checksum,
						secretType:   catName,
						samplePath:   loc,
						severity:     sevStr,
						projectsMap:  make(map[string]string),
						workspaceMap: make(map[string]bool),
					}
					secretTrackerMap[checksum] = tracker
				}
				tracker.occurrences++
				tracker.projectsMap[smry.ID] = smry.Name
				tracker.workspaceMap[wsName] = true
			}
		}

		projExp.CriticalCount = projCrit
		projExp.HighCount = projHigh
		projExp.MediumCount = projMed
		projExp.LowCount = projLow
		projExp.ProdLeaks = projProd
		projExp.NonProdLeaks = projNonProd

		// Compute Project Security Score (100 - weighted penalty)
		penalty := (projCrit * 25) + (projHigh * 10) + (projMed * 3) + (projLow * 1)
		score := 100 - penalty
		if score < 0 {
			score = 0
		}
		projExp.SecurityScore = score
		analytics.ProjectBreakdown = append(analytics.ProjectBreakdown, projExp)

		if projExp.TotalFindings > 0 || !smry.LastScan.IsZero() {
			totalWeight += score
			projectCountWithScans++
		}

		// Trend analysis from historical scans
		scans, err := a.store.ListProjectScans(smry.ID, 10, 0)
		if err == nil {
			for _, sc := range scans {
				if sc == nil {
					continue
				}
				dateStr := sc.StartedAt.Format("2006-01-02")
				if dateStr == "0001-01-01" && sc.CompletedAt != nil {
					dateStr = sc.CompletedAt.Format("2006-01-02")
				}
				if dateStr == "0001-01-01" {
					continue
				}

				metrics, err := a.store.GetScanMetrics(smry.ID, sc.ID)
				if err == nil && metrics != nil {
					tp, exists := trendMap[dateStr]
					if !exists {
						tp = &DashboardTrendPoint{Date: dateStr}
						trendMap[dateStr] = tp
					}
					tp.Total += metrics.TotalFindings
					if metrics.FindingsBySeverity != nil {
						tp.Critical += metrics.FindingsBySeverity["Critical"]
						tp.High += metrics.FindingsBySeverity["High"]
						tp.Medium += metrics.FindingsBySeverity["Medium"]
						tp.Low += metrics.FindingsBySeverity["Low"]
					}
				}
			}
		}
	}

	// Overall Security Score
	if projectCountWithScans > 0 {
		analytics.OverallSecurityScore = totalWeight / projectCountWithScans
	} else {
		analytics.OverallSecurityScore = 100
	}

	// Workspaces aggregation
	analytics.TotalWorkspaces = len(workspacesMap)
	for _, ws := range workspacesMap {
		wsPenalty := (ws.CriticalCount * 25) + (ws.HighCount * 10) + (ws.MediumCount * 3)
		wsScore := 100 - (wsPenalty / (ws.ProjectCount + 1))
		if wsScore < 0 {
			wsScore = 0
		}
		ws.SecurityScore = wsScore
		analytics.WorkspaceBreakdown = append(analytics.WorkspaceBreakdown, *ws)
	}

	// Reused secrets analysis
	analytics.UniqueSecretsCount = len(secretTrackerMap)
	for _, tracker := range secretTrackerMap {
		if tracker.occurrences > 1 {
			analytics.ReusedSecretsCount++
			analytics.ReusedSecretLeaks += tracker.occurrences

			var pIDs []string
			var pNames []string
			for pid, pname := range tracker.projectsMap {
				pIDs = append(pIDs, pid)
				pNames = append(pNames, pname)
			}
			var wsList []string
			for ws := range tracker.workspaceMap {
				wsList = append(wsList, ws)
			}

			analytics.TopReusedSecrets = append(analytics.TopReusedSecrets, ReusedSecretInsight{
				Checksum:     tracker.checksum,
				SecretType:   tracker.secretType,
				Occurrences:  tracker.occurrences,
				ProjectIDs:   pIDs,
				ProjectNames: pNames,
				Workspaces:   wsList,
				SamplePath:   tracker.samplePath,
				Severity:     tracker.severity,
			})
		}
	}

	// Sort reused secrets by occurrences descending
	sort.Slice(analytics.TopReusedSecrets, func(i, j int) bool {
		return analytics.TopReusedSecrets[i].Occurrences > analytics.TopReusedSecrets[j].Occurrences
	})
	if len(analytics.TopReusedSecrets) > 10 {
		analytics.TopReusedSecrets = analytics.TopReusedSecrets[:10]
	}

	// Compute High ROI Fixes
	roiID := 1

	// ROI Rule 1: Top Reused Secrets (Revoking 1 key resolves N leaks)
	for _, rs := range analytics.TopReusedSecrets {
		if roiID > 5 {
			break
		}
		impactPct := 0.0
		if analytics.TotalFindings > 0 {
			impactPct = (float64(rs.Occurrences) / float64(analytics.TotalFindings)) * 100.0
		}
		targetPID := ""
		if len(rs.ProjectIDs) > 0 {
			targetPID = rs.ProjectIDs[0]
		}
		analytics.TopROIFixes = append(analytics.TopROIFixes, ROIFixRecommendation{
			ID:              fmt.Sprintf("ROI-%d", roiID),
			Title:           fmt.Sprintf("Rotate Reused Secret (%s)", rs.SecretType),
			Description:     fmt.Sprintf("Secret hash [%s...] is reused across %d files in %d project(s) (%s). Rotating this key eliminates %d finding instances.", truncateString(rs.Checksum, 8), rs.Occurrences, len(rs.ProjectIDs), strings.Join(rs.ProjectNames, ", "), rs.Occurrences),
			ImpactCount:     rs.Occurrences,
			ImpactPercent:   impactPct,
			Category:        "ReusedSecret",
			TargetProjectID: targetPID,
			Checksum:        rs.Checksum,
		})
		roiID++
	}

	// ROI Rule 2: Hotspot Files (Single file with multiple critical leaks)
	var hotspots []*fileHotspot
	for _, hs := range fileHotspotMap {
		if hs.count >= 2 {
			hotspots = append(hotspots, hs)
		}
	}
	sort.Slice(hotspots, func(i, j int) bool {
		return hotspots[i].count > hotspots[j].count
	})

	for _, hs := range hotspots {
		if roiID > 5 {
			break
		}
		impactPct := 0.0
		if analytics.TotalFindings > 0 {
			impactPct = (float64(hs.count) / float64(analytics.TotalFindings)) * 100.0
		}
		analytics.TopROIFixes = append(analytics.TopROIFixes, ROIFixRecommendation{
			ID:              fmt.Sprintf("ROI-%d", roiID),
			Title:           fmt.Sprintf("Clean Hotspot File in %s", hs.projectName),
			Description:     fmt.Sprintf("File [%s] contains %d hardcoded secrets (%d critical/high). Remediating or excluding this single file reduces total findings by %.1f%%.", hs.filePath, hs.count, hs.criticals, impactPct),
			ImpactCount:     hs.count,
			ImpactPercent:   impactPct,
			Category:        "HotspotFile",
			TargetProjectID: hs.projectID,
			TargetFile:      hs.filePath,
		})
		roiID++
	}

	// Sort ROI Fixes by ImpactCount descending and cap at 5
	sort.Slice(analytics.TopROIFixes, func(i, j int) bool {
		return analytics.TopROIFixes[i].ImpactCount > analytics.TopROIFixes[j].ImpactCount
	})
	if len(analytics.TopROIFixes) > 5 {
		analytics.TopROIFixes = analytics.TopROIFixes[:5]
	}

	// Categories distribution
	for cat, count := range categoryMap {
		analytics.SecretCategories = append(analytics.SecretCategories, CategoryDistribution{
			Category: cat,
			Count:    count,
		})
	}
	sort.Slice(analytics.SecretCategories, func(i, j int) bool {
		return analytics.SecretCategories[i].Count > analytics.SecretCategories[j].Count
	})
	if len(analytics.SecretCategories) > 8 {
		analytics.SecretCategories = analytics.SecretCategories[:8]
	}

	// Trends sorting by date ascending
	for _, tp := range trendMap {
		analytics.Trends = append(analytics.Trends, *tp)
	}
	sort.Slice(analytics.Trends, func(i, j int) bool {
		return analytics.Trends[i].Date < analytics.Trends[j].Date
	})

	return analytics, nil
}

func truncateString(s string, l int) string {
	if len(s) <= l {
		return s
	}
	return s[:l]
}

// GetMetrics returns aggregate metrics from the Go Backend
func (a *App) GetMetrics() Metrics {
	analytics, err := a.GetDashboardAnalytics()
	if err != nil || analytics == nil {
		return Metrics{CriticalFindings: 0, ProjectsScanned: 0, SecurityScore: "100%"}
	}
	return Metrics{
		CriticalFindings: analytics.CriticalFindings,
		ProjectsScanned:  analytics.TotalProjects,
		SecurityScore:    fmt.Sprintf("%d%%", analytics.OverallSecurityScore),
	}
}

// GetProjects returns all projects
func (a *App) GetProjects() []*projects.ProjectSummary {
	if a.store == nil {
		return []*projects.ProjectSummary{}
	}
	return a.store.ListProjectSummaries()
}

// CreateProject creates a new project and returns its summary
func (a *App) CreateProject(name string, workspace string) (*projects.ProjectSummary, error) {
	if a.store == nil {
		return nil, fmt.Errorf("store not initialized")
	}

	desc := projects.ProjectDescription{
		Name:      name,
		Workspace: workspace,
		ScanPolicy: projects.ScanPolicy{
			ID:     "default",
			Policy: diagnostics.DefaultExclusion(),
		},
	}

	proj, err := a.store.CreateProject(desc)
	if err != nil {
		return nil, err
	}

	return a.store.GetProjectSummary(proj.ID)
}

// UpdateProjectDetails updates the basic details of a project (Name, Workspace, Description)
func (a *App) UpdateProjectDetails(projectID, name, workspace, description string) (*projects.ProjectSummary, error) {
	if a.store == nil {
		return nil, fmt.Errorf("store not initialized")
	}

	proj, err := a.store.GetProject(projectID)
	if err != nil {
		return nil, err
	}

	desc := projects.ProjectDescription{
		Name:         name,
		Workspace:    workspace,
		Description:  description,
		Repositories: proj.Repositories,
		ScanPolicy:   proj.ScanPolicy,
	}

	updated, err := a.store.UpdateProject(projectID, desc, projects.SimpleWorkspaceSummariser)
	if err != nil {
		return nil, err
	}

	return a.store.GetProjectSummary(updated.ID)
}

// RemoveRepository removes a repository location from an existing project
func (a *App) RemoveRepository(projectID string, repoUrl string) (*projects.ProjectSummary, error) {
	if a.store == nil {
		return nil, fmt.Errorf("store not initialized")
	}

	proj, err := a.store.GetProject(projectID)
	if err != nil {
		return nil, err
	}

	var newRepos []projects.Repository
	for _, r := range proj.Repositories {
		if r.Location != repoUrl {
			newRepos = append(newRepos, r)
		}
	}

	desc := projects.ProjectDescription{
		Name:         proj.Name,
		Workspace:    proj.Workspace,
		Repositories: newRepos,
		ScanPolicy:   proj.ScanPolicy,
	}

	updated, err := a.store.UpdateProject(projectID, desc, projects.SimpleWorkspaceSummariser)
	if err != nil {
		return nil, err
	}

	return a.store.GetProjectSummary(updated.ID)
}

// GetProjectFindings retrieves the security diagnostics from a scan for a project
func (a *App) GetProjectFindings(projectID string, scanID string) ([]*diagnostics.SecurityDiagnostic, error) {
	if a.store == nil {
		return nil, fmt.Errorf("store not initialized")
	}
	proj, err := a.store.GetProjectSummary(projectID)
	if err != nil {
		return nil, err
	}
	
	targetScanID := scanID
	if targetScanID == "" {
		targetScanID = proj.LastScanID
	}

	if targetScanID == "" {
		return []*diagnostics.SecurityDiagnostic{}, nil
	}
	results, err := a.store.GetScanResults(projectID, targetScanID)
	if err != nil {
		return nil, err
	}

	// Apply dynamic exclusions to accurately reflect newly created exceptions in the UI
	exProvider, err := a.store.BuildExclusionProvider(projectID)
	if err == nil && exProvider != nil {
		for _, diag := range results {
			hash := ""
			if diag.SHA256 != nil {
				hash = *diag.SHA256
			}
			src := ""
			if diag.Source != nil {
				src = *diag.Source
			}
			loc := ""
			if diag.Location != nil {
				loc = *diag.Location
			}
			if exProvider.ShouldExcludeHash(hash) || 
			   exProvider.ShouldExcludeValue(src) || 
			   exProvider.ShouldExcludePath(loc) || 
			   exProvider.ShouldExcludeHashOnPath(loc, hash) || 
			   exProvider.ShouldExclude(loc, src) {
				diag.Excluded = true
			}
		}
	}

	return results, nil
}

// ScanHistory represents a historical scan along with its metrics for the frontend.
type ScanHistory struct {
	ID        string             `json:"ID"`
	Status    string             `json:"Status"`
	StartedAt string             `json:"StartedAt"`
	Metrics   *store.ScanMetrics `json:"Metrics"`
}

// GetProjectScanHistory retrieves the historical scans for a project, including their summary metrics.
func (a *App) GetProjectScanHistory(projectID string, limit int) ([]ScanHistory, error) {
	if a.store == nil {
		return nil, fmt.Errorf("store not initialized")
	}
	
	scanRecords, err := a.store.ListProjectScans(projectID, limit, 0)
	if err != nil {
		return nil, err
	}

	var history []ScanHistory
	for _, record := range scanRecords {
		metrics, err := a.store.GetScanMetrics(projectID, record.ID)
		if err == nil {
			timestamp := record.StartedAt
			if timestamp.IsZero() && record.CompletedAt != nil {
				timestamp = *record.CompletedAt
			}
			history = append(history, ScanHistory{
				ID:        record.ID,
				Status:    record.Status,
				StartedAt: timestamp.Format(time.RFC3339),
				Metrics:   metrics,
			})
		}
	}
	
	return history, nil
}

// DeleteProjectScans removes all historical scans for a project.
func (a *App) DeleteProjectScans(projectID string) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.DeleteProjectScans(projectID)
}

// SelectDirectory opens a native file dialog to select a directory
func (a *App) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Repository Directory",
	})
}

// AddRepository adds a repository location to an existing project
func (a *App) AddRepository(projectID string, repoUrl string) (*projects.ProjectSummary, error) {
	if a.store == nil {
		return nil, fmt.Errorf("store not initialized")
	}

	proj, err := a.store.GetProject(projectID)
	if err != nil {
		return nil, err
	}

	desc := projects.ProjectDescription{
		Name:         proj.Name,
		Workspace:    proj.Workspace,
		Repositories: append(proj.Repositories, projects.Repository{Location: repoUrl}),
		ScanPolicy:   proj.ScanPolicy,
	}

	// UpdateProject replaces the existing description
	updated, err := a.store.UpdateProject(projectID, desc, projects.SimpleWorkspaceSummariser)
	if err != nil {
		return nil, err
	}

	return a.store.GetProjectSummary(updated.ID)
}

// dummyConsumer implements diagnostics.SecurityDiagnosticsConsumer
type dummyConsumer struct{}
func (d *dummyConsumer) ReceiveDiagnostic(diagnostic *diagnostics.SecurityDiagnostic) {}

// StartScan triggers an asynchronous scan for a given project ID
func (a *App) StartScan(projectID string) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}

	proj, err := a.store.GetProjectSummary(projectID)
	if err != nil {
		return fmt.Errorf("could not get project summary: %v", err)
	}

	log.Printf("Triggering scan for project: %s", projectID)

	exProvider, err := a.store.BuildExclusionProvider(projectID)
	if err != nil || exProvider == nil {
		exProvider = diagnostics.MakeEmptyExcludes()
	}

	// Configure the scanner securely
	secOptions := secrets.SecretSearchOptions{
		ShowSource:        true,
		CalculateChecksum: true,
		Exclusions:        exProvider,
	}

	// Simple dummy summariser for Phase 3
	summariser := func(projID, sID string, issues []*diagnostics.SecurityDiagnostic) *projects.ScanSummary {
		// Summarise the scan results
		model := projects.GenerateModel(len(proj.Repositories), secOptions.ShowSource, issues)
		return model.Summarise()
	}

	var cleanup func()

	scanIDC := func(id string) {
		log.Printf("Scan started with ID: %s", id)
		
		var ch <-chan store.ScanEvent
		ch, cleanup = a.store.GetBroker().Subscribe(id)

		go func() {
			for event := range ch {
				if event.Type == store.EventFinding {
					runtime.EventsEmit(a.ctx, "scan-finding", event.Data)
				}
			}
		}()
	}

	progressMon := func(p diagnostics.Progress) {
		// Output progress to standard log so it shows up in wails dev terminal
		log.Printf("Scan progress: %d/%d (%s)", p.Position, p.Total, p.CurrentFile)
	}

	consumer := &dummyConsumer{}

	// Run scan synchronously for Wails IPC call
	a.store.RunScan(a.ctx, proj.ID, proj.ScanPolicy, secrets.MakeSecretScanner(secOptions), scanIDC,
		utils.GitRepositoryStatusChecker, progressMon, summariser, projects.SimpleWorkspaceSummariser, consumer)
	
	if cleanup != nil {
		cleanup()
	}

	log.Printf("Scan completed for project: %s", projectID)

	return nil
}

type SuppressionOptions struct {
	ScopeType   string `json:"scopeType"`
	MatchString string `json:"matchString"`
	Path        string `json:"path"`
	Reason      string `json:"reason"`
}

// SuppressFinding marks a finding as a false positive
func (a *App) SuppressFinding(projectID string, diagnostic diagnostics.SecurityDiagnostic, opts SuppressionOptions) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}

	provider := "unknown"
	if diagnostic.ProviderID != nil {
		provider = *diagnostic.ProviderID
	} else if diagnostic.Justification.Headline.Description != "" {
		provider = diagnostic.Justification.Headline.Description
	}

	id := uuid.New().String()
	now := time.Now()

	scope := store.ExceptionScopeDetail{
		Type: opts.ScopeType,
	}

	switch opts.ScopeType {
	case "globalHash":
		scope.SecretChecksum = opts.MatchString
	case "globalString":
		scope.StringMatch = opts.MatchString
	case "globalRegex":
		scope.RegexMatch = opts.MatchString
	case "pathRegex":
		scope.RegexMatch = opts.MatchString 
	case "pathString":
		scope.Path = opts.Path
		scope.StringMatch = opts.MatchString
	case "pathHash":
		scope.Path = opts.Path
		scope.SecretChecksum = opts.MatchString
	case "pathRegexRegex":
		scope.Path = opts.Path
		scope.RegexMatch = opts.MatchString
	}

	exc := &store.Exception{
		ID:        id,
		ProjectID: projectID,
		RuleID:    provider,
		Scope:     &scope,
		Reason:    opts.Reason,
		CreatedBy: "system",
		CreatedAt: now,
		Status:    "active",
	}

	if err := a.store.CreateException(exc); err != nil {
		return fmt.Errorf("failed to remediate issue")
	}

	return nil
}

// GetExceptions returns a list of active exceptions for a project.
func (a *App) GetExceptions(projectID string) ([]*store.Exception, error) {
	if a.store == nil {
		return nil, fmt.Errorf("store not initialized")
	}
	return a.store.ListExceptions(projectID)
}

// RemoveException deletes an exception from the database.
func (a *App) RemoveException(id string) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.DeleteException(id)
}

// ExportExceptions opens a save file dialog and exports exceptions as a YAML file.
func (a *App) ExportExceptions(projectID string) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export Exceptions",
		DefaultFilename: "checkmate-exceptions.yaml",
		Filters: []runtime.FileFilter{
			{DisplayName: "YAML Files", Pattern: "*.yaml;*.yml"},
		},
	})
	
	if err != nil || path == "" {
		return err
	}
	
	// We use the same builder function but just want the definition.
	// Since BuildExclusionProvider doesn't expose the struct, let's write a small mapper here.
	allExceptions, err := a.store.ListExceptions(projectID)
	if err != nil {
		return err
	}
	
	def := &diagnostics.ExcludeDefinition{
		GloballyExcludedRegExs:  []string{},
		GloballyExcludedStrings: []string{},
		GloballyExcludedHashes:  []string{},
		PathExclusionRegExs:     []string{},
		PerFileExcludedStrings:  make(map[string][]string),
		PerFileExcludedHashes:   make(map[string][]string),
		PathRegexExcludedRegExs: make(map[string][]string),
	}

	for _, exc := range allExceptions {
		if exc.Status != "active" || exc.Scope == nil {
			continue
		}
		scope := exc.Scope
		switch scope.Type {
		case "globalHash", "value":
			if scope.SecretChecksum != "" {
				def.GloballyExcludedHashes = append(def.GloballyExcludedHashes, scope.SecretChecksum)
			}
		case "globalString":
			if scope.StringMatch != "" {
				def.GloballyExcludedStrings = append(def.GloballyExcludedStrings, scope.StringMatch)
			}
		case "globalRegex":
			if scope.RegexMatch != "" {
				def.GloballyExcludedRegExs = append(def.GloballyExcludedRegExs, scope.RegexMatch)
			}
		case "pathRegex":
			if scope.RegexMatch != "" {
				def.PathExclusionRegExs = append(def.PathExclusionRegExs, scope.RegexMatch)
			}
		case "pathString":
			if scope.Path != "" && scope.StringMatch != "" {
				def.PerFileExcludedStrings[scope.Path] = append(def.PerFileExcludedStrings[scope.Path], scope.StringMatch)
			}
		case "pathHash":
			if scope.Path != "" && scope.SecretChecksum != "" {
				def.PerFileExcludedHashes[scope.Path] = append(def.PerFileExcludedHashes[scope.Path], scope.SecretChecksum)
			}
		case "pathRegexRegex":
			if scope.Path != "" && scope.RegexMatch != "" {
				def.PathRegexExcludedRegExs[scope.Path] = append(def.PathRegexExcludedRegExs[scope.Path], scope.RegexMatch)
			}
		}
	}
	
	yamlData, err := yaml.Marshal(def)
	if err != nil {
		return err
	}
	
	return os.WriteFile(path, yamlData, 0644)
}

// ImportExceptions opens a file dialog, reads a YAML file and inserts rules into the database.
func (a *App) ImportExceptions(projectID string) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import Exceptions",
		Filters: []runtime.FileFilter{
			{DisplayName: "YAML Files", Pattern: "*.yaml;*.yml"},
		},
	})
	
	if err != nil || path == "" {
		return err
	}
	
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	
	var def diagnostics.ExcludeDefinition
	if err := yaml.Unmarshal(data, &def); err != nil {
		return fmt.Errorf("failed to parse YAML: %v", err)
	}
	
	// Convert YAML fields back to database Exceptions
	now := time.Now()
	createExc := func(scopeType string, scope store.ExceptionScopeDetail) {
		exc := &store.Exception{
			ID:        uuid.New().String(),
			ProjectID: projectID,
			RuleID:    "*",
			Scope:     &scope,
			Reason:    "imported_rule",
			CreatedBy: "system",
			CreatedAt: now,
			Status:    "active",
		}
		_ = a.store.CreateException(exc)
	}

	for _, hash := range def.GloballyExcludedHashes {
		createExc("globalHash", store.ExceptionScopeDetail{Type: "globalHash", SecretChecksum: hash})
	}
	for _, str := range def.GloballyExcludedStrings {
		createExc("globalString", store.ExceptionScopeDetail{Type: "globalString", StringMatch: str})
	}
	for _, reg := range def.GloballyExcludedRegExs {
		createExc("globalRegex", store.ExceptionScopeDetail{Type: "globalRegex", RegexMatch: reg})
	}
	for _, preg := range def.PathExclusionRegExs {
		createExc("pathRegex", store.ExceptionScopeDetail{Type: "pathRegex", RegexMatch: preg})
	}
	for path, stringsMap := range def.PerFileExcludedStrings {
		for _, str := range stringsMap {
			createExc("pathString", store.ExceptionScopeDetail{Type: "pathString", Path: path, StringMatch: str})
		}
	}
	for path, hashesMap := range def.PerFileExcludedHashes {
		for _, hash := range hashesMap {
			createExc("pathHash", store.ExceptionScopeDetail{Type: "pathHash", Path: path, SecretChecksum: hash})
		}
	}
	for path, regexesMap := range def.PathRegexExcludedRegExs {
		for _, reg := range regexesMap {
			createExc("pathRegexRegex", store.ExceptionScopeDetail{Type: "pathRegexRegex", Path: path, RegexMatch: reg})
		}
	}
	
	return nil
}
