# Protocol: Deployment Identity Sovereignty (The Omni-Grant Pattern)

## Purpose
To eliminate "Identity Hand-off Failures" during Google Cloud Build deployments, where permissions granted to the User/CLI are lost when the process unspools into Cloud Build or Cloud Functions Service Agents.

## The Problem (The "Zombie Key" Trap)
When running `firebase deploy`:
1.  **Phase 1 (CLI)**: Runs as `github-deploy` (or your local user). Checks existence of secrets.
2.  **Phase 2 (Build)**: Handoffs to Cloud Build Service Account (`<PROJECT_NUMBER>@cloudbuild.gserviceaccount.com`). *This step often fails if secret permissions aren't shared.*
3.  **Phase 3 (Runtime)**: Function executes as App Engine Default Service Account (`<PROJECT_ID>@appspot.gserviceaccount.com`).

Granting permission to *only* the Deployment SA (`github-deploy`) causes Phase 2 or Phase 3 to fail with `403 Forbidden`.

## The Solution: The Omni-Grant Pattern
For any sensitive resource (Secret Manager, Cloud Scheduler, Cloud Tasks), you **MUST** grant permissions to **ALL THREE** identities at the **Project Level**.

### 1. The Trinity of Identity
| Identity | Role | Purpose |
| :--- | :--- | :--- |
| **GitHub Deploy** (`github-deploy@...`) | **Trigger** | Initiates the deployment from CI/CD. |
| **Cloud Build** (`<NUM>@cloudbuild...`) | **Builder** | Validates configuration and builds containers. |
| **Runtime** (`<ID>@appspot...`) | **Executor** | Runs the code and accesses secrets at runtime. |

### 2. Mandatory Roles
For **Secret Manager** (Env Vars):
*   `roles/secretmanager.secretAccessor` (Payload Access) -> **ALL 3 Identities**
*   `roles/secretmanager.viewer` (Metadata Access) -> **GitHub Deploy** & **Cloud Build** (Required for validation checks).

For **Cloud Scheduler** (Cron Jobs):
*   `roles/cloudscheduler.admin` -> **GitHub Deploy** & **Cloud Build**.

## Execution Protocol
When initializing a new project or fixing permission errors:
1.  Identify the Project Number (`gcloud projects describe <PROJECT_ID>`).
2.  Executes the **Omni-Grant** binding immediately. Do not wait for a failure.
3.  **NEVER** assume `owner` role on the deploying user is sufficient for the Cloud Build agent.
