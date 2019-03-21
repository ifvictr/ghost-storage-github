import Octokit from '@octokit/rest'
import Promise from 'bluebird'
import fs from 'fs'
import BaseStorage from 'ghost-storage-base'
import isUrl from 'is-url'
import path from 'path'
import { URL } from 'url'
import { isWorkingUrl, removeLeadingSlash } from './utils'

const readFile = Promise.promisify(fs.readFile)

const RAW_GITHUB_URL = 'https://raw.githubusercontent.com'

class GitHubStorage extends BaseStorage {
    constructor(config) {
        super()

        const {
            baseUrl,
            branch,
            destination,
            owner,
            repo,
            token
        } = config

        this.branch = process.env.GHOST_GITHUB_BRANCH || branch || 'master'
        this.destination = process.env.GHOST_GITHUB_DESTINATION || destination || '/'
        this.owner = process.env.GHOST_GITHUB_OWNER || owner
        this.repo = process.env.GHOST_GITHUB_REPO || repo

        baseUrl = baseUrl || process.env.GHOST_GITHUB_BASE_URL
        this.baseUrl = isUrl(baseUrl)
            ? baseUrl
            : `${RAW_GITHUB_URL}/${this.owner}/${this.repo}/${this.branch}`

        token = token || process.env.GHOST_GITHUB_TOKEN
        this.client = new Octokit({ auth: `token ${token}` })
    }

    delete() {
        // TODO: Find a way to get the blob SHA of the target file
        return Promise.reject('Not implemented')
    }

    exists(filename, targetDir) {
        const filepath = path.join(targetDir || this.getTargetDir(), filename)
        return isWorkingUrl(this.getUrl(filepath))
    }

    read(options) {
        // Not needed because absolute URLS are already used to link to the images
    }

    save(file, targetDir) {
        const dir = targetDir || this.getTargetDir()

        return Promise.join(this.getUniqueFileName(file, dir), readFile(file.path, 'base64'), (filename, data) => {
            return this.client.repos.createFile({
                owner: this.owner,
                repo: this.repo,
                branch: this.branch,
                message: `Create ${filename}`,
                path: this.getFilepath(filename),
                content: data
            })
        })
            .then(res => this.getUrl(res.data.content.path))
            .catch(Promise.reject)
    }

    serve() {
        return (req, res, next) => {
            next()
        }
    }

    getUrl(filename) {
        const url = new URL(this.baseUrl);
        url.pathname = this.getFilepath(filename);

        return url.toString()
    }

    getFilepath(filename) {
        return removeLeadingSlash(path.join(this.destination, filename))
    }
}

export default GitHubStorage