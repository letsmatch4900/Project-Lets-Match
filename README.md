# Project-Lets-Match

Main Branch (main)

- Stable production-ready code.
- Only deployable code is merged here after thorough testing.
- Protected to require PR reviews and successful checks before merging.

Development Branch (dev)

- The central branch for integrating all features and bug fixes.
- Frequently updated by merging feature and bugfix branches.
- Regular testing happens here.

Feature Branches (feature/branch-name)

- Branches off from dev.
- Each new feature gets its own branch (feature/login-page, feature/chat-functionality).
- Merges back to dev after completion and review.

Bugfix Branches (bugfix/branch-name)

- Branches off from dev.
- Used for fixing specific bugs (bugfix/fix-auth-error).
- Merges back to dev.

Hotfix Branches (hotfix/branch-name)

- Branches off from main.
- Used for urgent production fixes (hotfix/fix-deployment-crash).
- Merges back into both main and dev.

Release Branches (release/vX.X.X)

- Created from dev when preparing for a stable release.
- Used for final testing and polishing before merging into main.



Workflow Overview
Feature Development

Developers create branches from dev (feature/branch-name).
Regular commits and push to GitHub.
Code Reviews

Create Pull Requests (PRs) to merge feature branches back into dev.
At least one reviewer should approve the PR.
Testing

Continuous Integration (CI) pipelines (GitHub Actions) run automated tests for dev and main.
Hotfix Process

Directly branch from main for urgent fixes and merge back into both main and dev.
Deployment

Firebase Hosting can deploy from main.
Create GitHub Actions workflows for automatic deployments.
