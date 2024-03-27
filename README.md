# Preview branches with Fly.io and Neon

This is an example project that shows how you can create a branch for every [Fly.io](https://fly.io) preview deployment.


## Getting started

You can copy the files located at `.github/workflows` and add them to your own project. 

You will then need to set the following secrets in your repository:

- `NEON_PROJECT_ID`: The ID of your Neon project, you can find it in your Neon project settings.
- `NEON_API_KEY`: Your Neon API key, you can find it in your Neon account settings.
- `FLY_API_TOKEN`: Your Fly.io API token, you can find it in your Fly.io account settings.
- `DATABASE_URL`: The connection string for your production database. You can find it in your Neon project's connection details.
- `GH_TOKEN`: A GitHub token with access to your repository, you can create one in your GitHub account settings. You will need to give it access to the `repo` scope so that the `deploy-preview` workflow can comment on the pull request. You can uncomment the step which uses this token in the `.github/workflows/deploy-preview.yml` workflow file.
- `NEON_DATABASE_USERNAME`: The username for your Neon database. This is the same as the username for your production database.


## How it works

### Creating a preview deployment
`.github/workflows/deploy-preview.yml` automates the deployment process to a preview environment. It is activated on a `pull_request` event and uses the `NEON_API_KEY`, `NEON_PROJECT_ID`, `GH_TOKEN`, `FLY_API_TOKEN` and `NEON_DATABASE_USERNAME` secrets that are set in the repository.

The workflow has a single job called `deploy-preview` and it consists of the following steps:

1. Ensures concurrency control, allowing only one deployment at a time per pull request.
1. Checks out the codebase using [`actions/checkout@v4`](https://github.com/marketplace/actions/checkout).
2. Sets up PNPM with [`pnpm/action-setup@v2`](https://github.com/marketplace/actions/setup-pnpm). (You can use another package manager depending on your setup.)
3. Configures Node.js version with caching for PNPM via actions/setup-node@v4.
4. Installs dependencies using `pnpm install`.
5. Retrieves the branch name using [`tj-actions/branch-names@v8`](https://github.com/marketplace/actions/branch-names).
6. Creates a Neon database branch for the pull request with [`neondatabase/create-branch-action@v4`](https://github.com/marketplace/actions/neon-database-create-branch-action). By default, the branch name will be `preview/<git-branch-name>-<commit_SHA>`
7. Executes database migrations by setting up the `.env` file and running migration scripts.
8. Deploys the application with [`superfly/fly-pr-review-apps@1.2.0`](https://github.com/marketplace/actions/github-action-for-deplying-staging-apps-on-fly-io), while including the Neon database URL.
9. Comments on the pull request with deployment and database branch details using `thollander/actions-comment-pull-request@v2`.

### Creating a production deployment

`.github/workflows/deploy-production.yml` automates the deployment process to a production environment. It is activated on a `push` event to the `main` branch and uses the `FLY_API_TOKEN` and `DATABASE_URL` secrets that are set in the repository.

The workflow has a single job called `production-deploy` and it consists of the following steps:
1. Checks out the codebase using actions/checkout@v4.
2. Sets up PNPM using pnpm/action-setup@v2 and specifies version 8. (You can use another package manager depending on your setup.)
3. Configures the environment to use Node.js version 18 using actions/setup-node@v4, with a cache configured for PNPM.
4. Installs project dependencies using pnpm install.
5. Runs database migrations with the command `prisma migrate deploy`.
6. Sets up Fly CLI (flyctl) using [superfly/flyctl-actions/setup-flyctl@master](https://github.com/marketplace/actions/github-action-for-flyctl).
7. Finally, deploys the application using Fly CLI with the command `flyctl deploy --remote-only`.


### Neon branch cleanup

`.github/workflows/delete-neon-branch.yml` automates the cleanup of branches in Neon. It is activated on a `pull_request` event with the action `closed`. This will ensure that Neon branches are deleted when a pull request is closed/merged.

The workflow uses [`neondatabase/delete-branch-action@v3.1.3`](https://github.com/neondatabase/delete-branch-action/tree/v3.1.3/) action which uses the `NEON_API_KEY` and `NEON_PROJECT_ID` secrets that are set in the repository.