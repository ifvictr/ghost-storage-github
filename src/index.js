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
            password,
            repo,
            token,
            type,
            user,
        } = config

        this.branch = branch || 'master'
        this.destination = destination
        this.password = password
        this.repo = repo
        this.token = token
        this.type = type || 'token'
        this.user = user

        this.baseUrl = isUrl(baseUrl)
            ? baseUrl
            : `${RAW_GITHUB_URL}/${this.user}/${this.repo}/${this.branch}`
        this.client = new Octokit()

        this.client.authenticate({
            type: this.type,
            username: this.user,
            password: this.password,
            token: this.token,
        })
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
                owner: this.user,
                repo: this.repo,
                branch: this.branch,
                message: 'Add new image',
                path: this.getFilepath(filename),
                content: data
            })
        })
            .then(res => res.data.content.download_url)
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