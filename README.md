# ghost-github

Storage on GitHub for Ghost. Good for blogs hosted on platforms without a persistent filesystem (e.g. [Heroku](https://heroku.com)).

## Installation

```bash
cd /path/to/your/ghost/installation
npm install ghost-github
mkdir content/storage
cp -r node_modules/ghost-github content/storage/ghost-github
```

## Usage

Add the following to your configuration file and modify it accordingly.

```js
storage: {
    active: 'ghost-github',
    'ghost-github': {
        // Personal access token (required)
        token: '[my token here]',
        // Username of the repo's owner (required)
        owner: '[my username here]',
        // Name of repo you want to save files to (required)
        repo: 'ghost-assets',
        // Branch you want to save to. If omitted, it will default to master (optional)
        branch: 'master',
        // The subdirectory you want all images to go into. If omitted, it will default to the root directory (optional)
        destination: '',
        // Will use base URL for image requests (optional)
        baseUrl: 'https://cdn.example.com'
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

## License

[MIT](LICENSE.txt)