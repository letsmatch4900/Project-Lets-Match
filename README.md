![image](https://github.com/user-attachments/assets/06df5a8b-ca90-4185-a6a5-6ac0ff58964f)# Project-Lets-Match

Branch Structure
Main Branch (main)

Stable production-ready code.
Only deployable code is merged here after thorough testing.
Protected to require PR reviews and successful checks before merging.
Development Branch (dev)

The central branch for integrating all features and bug fixes.
Frequently updated by merging feature and bugfix branches.
Regular testing happens here.
Feature Branches (feature/branch-name)

Branches off from dev.
Each new feature gets its own branch (feature/login-page, feature/chat-functionality).
Merges back to dev after completion and review.
Bugfix Branches (bugfix/branch-name)

Branches off from dev.
Used for fixing specific bugs (bugfix/fix-auth-error).
Merges back to dev.
Hotfix Branches (hotfix/branch-name)

Branches off from main.
Used for urgent production fixes (hotfix/fix-deployment-crash).
Merges back into both main and dev.
Release Branches (release/vX.X.X)

Created from dev when preparing for a stable release.
Used for final testing and polishing before merging into main.
