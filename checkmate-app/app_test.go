package main

import (
	"context"
	"os"
	"testing"

	"github.com/adedayo/checkmate/pkg/store/sqlite"
)

// setupTestApp creates a new App instance hooked to an ephemeral SQLite store
func setupTestApp(t *testing.T) (*App, func()) {
	t.Helper()

	// Create temp dir for SQLite
	tempDir, err := os.MkdirTemp("", "checkmate_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	pm, err := sqlite.New(tempDir)
	if err != nil {
		t.Fatalf("Failed to initialize sqlite store: %v", err)
	}

	app := &App{
		store: pm,
	}
	
	app.startup(context.Background())

	cleanup := func() {
		os.RemoveAll(tempDir)
	}

	return app, cleanup
}

func TestAppInitialization(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	if app.store == nil {
		t.Errorf("Expected store to be initialized, got nil")
	}
}

func TestProjectLifecycle(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// Initially, there should be no projects
	projects := app.GetProjects()
	if len(projects) != 0 {
		t.Errorf("Expected 0 projects, got %d", len(projects))
	}

	// Create a project
	projName := "Test Project"
	workspace := "Engineering"
	proj, err := app.CreateProject(projName, workspace)
	if err != nil {
		t.Fatalf("CreateProject failed: %v", err)
	}

	if proj == nil {
		t.Fatalf("CreateProject returned nil summary")
	}
	if proj.Name != projName {
		t.Errorf("Expected project name %s, got %s", projName, proj.Name)
	}
	if proj.Workspace != workspace {
		t.Errorf("Expected workspace %s, got %s", workspace, proj.Workspace)
	}
	if proj.ID == "" {
		t.Errorf("Expected project ID to be set")
	}

	// Retrieve projects
	projects = app.GetProjects()
	if len(projects) != 1 {
		t.Fatalf("Expected 1 project, got %d", len(projects))
	}
	
	retrieved := projects[0]
	if retrieved.ID != proj.ID {
		t.Errorf("Expected retrieved ID %s to match created ID %s", retrieved.ID, proj.ID)
	}
}

func TestAddRepository(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	proj, err := app.CreateProject("Test Repo Project", "Web")
	if err != nil {
		t.Fatalf("CreateProject failed: %v", err)
	}

	repoUrl := "https://github.com/example/repo.git"
	updatedProj, err := app.AddRepository(proj.ID, repoUrl)
	if err != nil {
		t.Fatalf("AddRepository failed: %v", err)
	}

	if len(updatedProj.Repositories) != 1 {
		t.Fatalf("Expected 1 repository, got %d", len(updatedProj.Repositories))
	}
	
	if updatedProj.Repositories[0].Location != repoUrl {
		t.Errorf("Expected repo location %s, got %s", repoUrl, updatedProj.Repositories[0].Location)
	}
}

func TestMetrics(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	// Initial metrics
	metrics := app.GetMetrics()
	if metrics.ProjectsScanned != 0 {
		t.Errorf("Expected 0 projects, got %d", metrics.ProjectsScanned)
	}
	if metrics.SecurityScore != "100%" {
		t.Errorf("Expected 100%% score for no projects, got %s", metrics.SecurityScore)
	}

	// Create two projects
	_, _ = app.CreateProject("Project 1", "")
	_, _ = app.CreateProject("Project 2", "")

	metrics = app.GetMetrics()
	if metrics.ProjectsScanned != 2 {
		t.Errorf("Expected 2 projects, got %d", metrics.ProjectsScanned)
	}
}

func TestGetProjectFindings(t *testing.T) {
	app, cleanup := setupTestApp(t)
	defer cleanup()

	proj, err := app.CreateProject("Project Without Scans", "")
	if err != nil {
		t.Fatalf("CreateProject failed: %v", err)
	}

	// A new project has no scans, so findings should be empty (not error out)
	findings, err := app.GetProjectFindings(proj.ID, "")
	if err != nil {
		t.Fatalf("GetProjectFindings failed: %v", err)
	}

	if len(findings) != 0 {
		t.Errorf("Expected 0 findings, got %d", len(findings))
	}
}
