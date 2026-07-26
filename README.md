# CheckMate Suite

This is the meta-repository for the **CheckMate** ecosystem, a multi-layered detection engine for finding hard-coded secrets across codebases, configuration files, and repositories.

By keeping all the related packages together, this suite enables a streamlined GitOps release pipeline and provides an easy onboarding process for developers and contributors.

## Included Components
This suite brings together the following submodules:
- [**checkmate**](./checkmate): The main CLI application and API.
- [**checkmate-core**](./checkmate-core): The core detection engine and models.
- [**checkmate-plugin**](./checkmate-plugin): Extensibility and plugin architecture.
- [**git-service-driver**](./git-service-driver): Git repository integration layer.
- [**ldap-sync**](./ldap-sync): Directory synchronization services.
- [**checkmate-badger-project-manager**](./checkmate-badger-project-manager): Persistent data layer using BadgerDB.

## Cloning the Suite
To clone the suite and all of its dependencies in a single command, run:

```bash
git clone --recurse-submodules https://github.com/adedayo/checkmate-suite.git
```

## Automated Releases
This repository acts as the central control plane for deploying the suite. The automated release pipeline is governed by GitHub Actions.

To push a new version:
1. Make sure all local sub-repositories are pushed and synced to the `main` branch.
2. Run the provided orchestration script from the root of this suite:

```bash
./scripts/release.sh v0.9.5
```

This will automatically bump Go versions, sync dependencies across `go.mod` files, commit the changes to submodules, and trigger the GitHub Action that tags the libraries and runs GoReleaser to publish Docker images (to ghcr.io) and Homebrew formulas.

## License
CheckMate and its suite of tools are open source under the [BSD 3-Clause License](LICENSE).
