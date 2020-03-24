# ghost-storage-github

GitHub storage adapter for Ghost. Good for blogs hosted on platforms without a persistent filesystem (e.g. [Heroku](https://heroku.com)).

## Installation

```bash
cd /path/to/your/ghost/installation
npm install ghost-storage-github
mkdir content/adapters/storage
cp -r node_modules/ghost-storage-github content/adapters/storage/ghost-storage-github
```

## Usage

Add the following to your configuration file and modify it accordingly.

```json
"storage": {
    "active": "ghost-storage-github",
    "ghost-storage-github": {
        "token": "[my token here]",
        "owner": "[my username here]",
        "repo": "ghost-assets",
        "branch": "master",
        "destination": "",
        "baseUrl": "https://cdn.example.com",
        "useRelativeUrls": false
    }
}
```

- `token`: Personal access token (required)
- `owner`: Username of the repo's owner (required)
- `repo`: Name of repo you want to save files to (required)
- `branch`: Branch you want to save to. If omitted, it will default to master (optional)
- `destination`: The subdirectory you want all images to go into. If omitted, it will default to the root directory (optional)
- `baseUrl`: Will use base URL for image requests (optional)
- `useRelativeUrls`: Will return the relative URL upon image uploads in posts (optional)

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
