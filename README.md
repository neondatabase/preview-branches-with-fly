# Preview branches with Fly.io and Neonhttps://github.com/neondatabase-labs/preview-branches-with-fly/blob/update-the-readme/package.json

This is an example project that shows how you can create a branch for every [Fly.io](https://fly.io) preview deployment.

## Tech Stack
- DB: [Neon](https://neon.tech/)
- Hosting: [Fly.io](https://fly.io)
- App: [Fastify](https://fastify.dev/)
- Node Package Management: [pnpm](https://pnpm.io/)
- ORM: [Drizzle](https://orm.drizzle.team/)

## Getting started

You can copy the files located at [`.github/workflows/`](./.github/workflows/) and add them to your own project. 

You will then need to set the following secrets in your repository:

- `FLY_API_TOKEN`: Your Fly.io API token, you can find it in your Fly.io account settings.
- `NEON_API_KEY`: Your Neon API key, you can find it in your Neon account settings.
- `DATABASE_URL`: The connection string for your production database. You can find it in your Neon project's connection details.
- `GH_TOKEN`: A GitHub token with access to your repository, you can create one in your GitHub account settings. You will need to give it access to the `repo` scope so that the `deploy-preview` workflow can comment on the pull request. You can uncomment the step which uses this token in the `.github/workflows/deploy-preview.yml` workflow file.

You will then need to set the following variables:

- `NEON_PROJECT_ID`: The ID of your Neon project, you can find it in your Neon project settings.

## How it works

### Preview deployment
[`.github/workflows/deploy-preview.yml`](./.github/workflows/deploy-preview.yml) automates the deployment process to a preview environment.

Activated on a `pull_request` event 
```yaml
on: [pull_request]
```

Requires the `NEON_API_KEY`, `NEON_PROJECT_ID`, `GH_TOKEN`, and `FLY_API_TOKEN` secrets that are set in the repository.

The workflow has a single job called `deploy-preview`
```yaml
jobs:
  deploy-preview:
```
 
In that job it consists of the following steps:

1. Ensures concurrency control, allowing only one deployment at a time per pull request.
```yaml
    concurrency:
      group: pr-${{ github.event.number }}
```

1. Check out the codebase using [`actions/checkout@v4`](https://github.com/marketplace/actions/checkout).
```yaml
      - uses: actions/checkout@v4
```
1. Sets up PNPM with [`pnpm/action-setup@v2`](https://github.com/marketplace/actions/setup-pnpm). (You can use another package manager depending on your setup.)
```yaml
      - uses: pnpm/action-setup@v2
        with:
          version: 8
```
1. Configures Node.js version with caching for PNPM via `actions/setup-node@v4`.
```yaml
      - name: Use Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: "pnpm"
```
1. Installs dependencies using `pnpm install`.
```yaml
      - name: Install dependencies
        run: pnpm install
```
1. Retrieves and normalizes the branch name using [`tj-actions/branch-names@v8`](https://github.com/marketplace/actions/branch-names).
```yaml
      - name: Get branch name
        id: branch-name
        uses: tj-actions/branch-names@v8
```
1. Creates a Neon database branch for the pull request with [`neondatabase/create-branch-action@v5`](https://github.com/marketplace/actions/neon-database-create-branch-action). By default, the branch name will be `preview/<git-branch-name>`
```yaml
      - name: Create Neon Branch
        id: create-branch
        uses: neondatabase/create-branch-action@v4
        with:
          project_id: ${{ env.NEON_PROJECT_ID }}
          # parent: dev # optional (defaults to your primary branch)
          branch_name: preview/${{ steps.branch-name.outputs.current_branch }}
          username: "neondb_owner" # change this to your Neon database username if you're not using the default
          api_key: ${{ env.NEON_API_KEY }}
```
1. Executes database migrations by setting up the `.env` file and running migration scripts.
```
      - run: |
          echo "DATABASE_URL=${{ steps.create-branch.outputs.db_url_with_pooler }}" >> "$GITHUB_ENV"

      - run: pnpm run db:migrate
```
1. Deploys the application with [`superfly/fly-pr-review-apps@1.2.1`](https://github.com/marketplace/actions/github-action-for-deplying-staging-apps-on-fly-io), while including the Neon database URL.
```yaml
      - name: Deploy
        id: deploy
        uses: superfly/fly-pr-review-apps@1.2.1
        with:
          secrets: DATABASE_URL=${{ steps.create-branch.outputs.db_url }}?sslmode=require
```
1.  Comments on the pull request with deployment and database branch details using `thollander/actions-comment-pull-request@v2`. Here's an [example comment](https://github.com/neondatabase/preview-branches-with-fly/pull/9#issuecomment-1924660371)
```yaml
      - name: Comment on Pull Request
        uses: thollander/actions-comment-pull-request@v2
        with:
          # GITHUB_TOKEN: ${{ env.GH_TOKEN }} # Required for commenting on pull requests for private repos
          message: |
            Fly Preview URL :balloon: : ${{ steps.deploy.outputs.url }}
            Neon branch :elephant: : https://console.neon.tech/app/projects/${{ secrets.NEON_PROJECT_ID }}/branches/${{ steps.create-branch.outputs.branch_id }}
```

### Production deployment

[`.github/workflows/deploy-production.yml`](./.github/workflows/deploy-production.yml) automates the deployment process to a production environment. It is activated on a `push` event to the `main` branch and uses the `FLY_API_TOKEN` and `DATABASE_URL` secrets that are set in the repository.

The workflow has a single job called `production-deploy` and it consists of the following steps:
1. Checks out the codebase using `actions/checkout@v4`
2. Sets up PNPM using `pnpm/action-setup@v2` and specifies version 8. (You can use another package manager depending on your setup.)
3. Configures the environment to use Node.js version 18 using actions/setup-node@v4, with a cache configured for PNPM.
4. Installs project dependencies using pnpm install.
5. Runs database migrations with the command pnpm run db:migrate.
6. Sets up Fly CLI (flyctl) using [superfly/flyctl-actions/setup-flyctl@master](https://github.com/marketplace/actions/github-action-for-flyctl).
7. Finally, deploys the application using Fly CLI with the command `flyctl deploy --remote-only`.


### Neon branch cleanup

`.github/workflows/delete-neon-branch.yml` automates the cleanup of branches in Neon. It is activated on a `pull_request` event with the action `closed`. This will ensure that Neon branches are deleted when a pull request is closed/merged.

The workflow uses [`neondatabase/delete-branch-action@v3.1.3`](https://github.com/neondatabase/delete-branch-action/tree/v3.1.3/) action which uses the `NEON_API_KEY` and `NEON_PROJECT_ID` secrets that are set in the repository.
