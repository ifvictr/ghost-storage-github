# ghost-github

Storage on GitHub for Ghost. Used for [ghost-storage-github](https://hub.docker.com/r/jjai/ghost-storage-github/) Docker image

## Usage

Add the following to your configuration file. Replace values accordingly.

Example:

```json
"storage": {
    "active": "ghost-github",
    "ghost-github": {
        "type": "token",
        "user": "<username>",
        "token": "<token>",
        "repo": "<repo>",
        "branch": "master",
        "baseUrl": "https://cdn.leon.af",
        "format": "{yyyy}/{mm}/{dd}/{name}-{uuid}-{timestamp}-{random}{ext}",
        "path": "/"
    }
}
```

- As long as you have access to the user/repo, `user` does not have to match the user token is generated for.
- `baseUrl` (optional): Add the base URL for the github pages to use the baseUrl instead of raw.github.com URLs

## Questions

### How do I get a personal access token?

1. Create a new personal token [here](https://github.com/settings/tokens/new).
2. Select 'repo' (which will select everything under `repo`), as **ghost-github** will need access to your repository.
3. Copy the token that shows up upon successful creation, and paste that into the `token` field of **ghost-github**'s configuration.

## License

[MIT](LICENSE.txt)
