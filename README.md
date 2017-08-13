# ghost-github
Storage on GitHub for Ghost. Good for blogs hosted on platforms without a persistent filesystem (e.g. [Heroku](https://heroku.com)).

## Installation
```
cd /path/to/your/ghost/directory
npm install ghost-github
mkdir content/storage
cp -r node_modules/ghost-github content/storage/ghost-github
```

## Usage
Add the following to your configuration file depending on the version of Ghost you have.

### < 1.0.0
```js
storage: {
    active: "ghost-github",
    "ghost-github": {
        // Required: Can either be basic, oauth, or token
        type: "...",
        user: "...",
        // Either: GitHub login credentials (basic only)
        password: "...",
        // Either: Personal access token (for token and oauth)
        token: "...",
        // Required: Name of repo you want to save files to
        repo: "...",
        // Optional: Will save to branch of repo, defaults to master
        branch: "..."
    }
}
```

### >= 1.0.0
Options from above also apply here except for the formatting.
```json
"storage": {
    "active": "ghost-github",
    "ghost-github": {
        "type": "...",
        "user": "...",
        "password": "...",
        "token": "...",
        "repo": "...",
        "branch": "..."
    }
}

```

## Questions
### How do I get a personal access token?
1. Create a new personal token [here](https://github.com/settings/tokens/new).
2. Select 'repo' (which will select everything under `repo`), as **ghost-github** will need access to your repository.
3. Copy the token that shows up upon successful creation, and paste that into the `token` field of **ghost-github**'s configuration.

### I'm getting a "Bad credentials" error. What should I do?
Your token or password might be incorrect. You should double-check your configuration.

### I'm getting a "Not found" error. What should I do?
Make sure the repository you specified exists. Also, check to make sure the branch (if specified) exists in the repo.

## Contributors
Without these awesome people, I might've never been able to finish this.
- [@acburdine](https://github.com/acburdine)
- [@shmishtopher](https://github.com/shmishtopher)

## License
[MIT](LICENSE.txt)