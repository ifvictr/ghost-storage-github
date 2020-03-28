# ghost-storage-github

GitHub storage adapter for Ghost. Good for blogs hosted on platforms without a persistent filesystem (i.e. [Heroku](https://heroku.com)).

## Installation

```bash
cd /path/to/your/ghost/installation
npm install ghost-storage-github
mkdir -p content/adapters/storage
cp -r node_modules/ghost-storage-github content/adapters/storage/ghost-storage-github
```

## Usage

Add the following to your configuration file and modify it accordingly.

```json
"storage": {
    "active": "ghost-storage-github",
    "ghost-storage-github": {
        "token": "<your token here>",
        "owner": "<your username here>",
        "repo": "ghost-assets",
        "branch": "master",
        "destination": "my/subdirectory",
        "baseUrl": "https://cdn.example.com",
        "useRelativeUrls": false
    }
}
```

Here's a comprehensive list of configurations:

| **Name**          | **Required?** | **Description**                                                                                                                                                                        | **Environment variable (prefixed with `GHOST_GITHUB_`)** |
|-------------------|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| `baseUrl`         | no            | Base URL of newly saved images. Uses raw.githubusercontent.com by default                                                                                                              | `BASE_URL`                                               |
| `branch`          | no            | Branch to push assets to. Defaults to `master`                                                                                                                                         | `BRANCH`                                                 |
| `destination`     | no            | Directory to push assets to. Defaults to `/`                                                                                                                                           | `DESTINATION`                                            |
| `owner`           | yes           | Username of the user/organization the repo is under                                                                                                                                    | `OWNER`                                                  |
| `repo`            | yes           | Name of the repo                                                                                                                                                                       | `REPO`                                                   |
| `token`           | yes           | Your personal access token                                                                                                                                                             | `TOKEN`                                                  |
| `useRelativeUrls` | no            | Whether or not to return relative URLs (i.e. under `/content/images`) instead of absolute URLs. Might be of use to people who generate and serve a static version of their Ghost blog. | `USE_RELATIVE_URLS`                                      |

## Questions

### How do I get a personal access token?

1. Create a new personal token [here](https://github.com/settings/tokens/new).
2. Select 'repo' (which will select everything under `repo`), as **ghost-storage-github** will need access to your repository.
3. Copy the token that shows up upon successful creation, and paste that into the `token` field of **ghost-storage-github**'s configuration.

### I'm getting a "Bad credentials" error. What should I do?

Your token or password might be incorrect. You should double-check your configuration.

### I'm getting a "Not found" error. What should I do?

Make sure the repository you specified exists. Also, check to make sure the branch (if specified) exists in the repo.

## License

[MIT](LICENSE.txt)
