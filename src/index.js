import { retry } from '@octokit/plugin-retry'
import { throttling } from '@octokit/plugin-throttling'
import { Octokit } from '@octokit/rest'
import Promise from 'bluebird'
import fs from 'fs'
import BaseStorage from 'ghost-storage-base'
import isUrl from 'is-url'
import path from 'path'
import { URL } from 'url'
import * as utils from './utils'

const ExtendedOctokit = Octokit.plugin([retry, throttling])
const readFile = Promise.promisify(fs.readFile)

const RAW_GITHUB_URL = 'https://raw.githubusercontent.com'

class GitHubStorage extends BaseStorage {
    constructor(config) {
        super()

        const {
            branch,
            destination,
            owner,
            repo
        } = config

        // Required config
        const token = process.env.GHOST_GITHUB_TOKEN || config.token
        this.owner = process.env.GHOST_GITHUB_OWNER || owner
        this.repo = process.env.GHOST_GITHUB_REPO || repo
        this.branch = process.env.GHOST_GITHUB_BRANCH || branch || 'master'

        // Optional config
        const baseUrl = utils.removeTrailingSlashes(process.env.GHOST_GITHUB_BASE_URL || config.baseUrl || '')
        this.baseUrl = isUrl(baseUrl)
            ? baseUrl
            : `${RAW_GITHUB_URL}/${this.owner}/${this.repo}/${this.branch}`
        this.destination = process.env.GHOST_GITHUB_DESTINATION || destination || '/'
        this.useRelativeUrls = process.env.GHOST_GITHUB_USE_RELATIVE_URLS === 'true' || config.useRelativeUrls || false

        this.client = new ExtendedOctokit({
            auth: `token ${token}`,
            throttle: {
                onRateLimit: (retryAfter, options) => {
                    console.warn(`Request quota exhausted for request ${options.method} ${options.url}`)
                    if (options.request.retryCount < 3) { // Retry 3 times
                        return true
                    }
                },
                onAbuseLimit: (retryAfter, options) => {
                    console.warn(`Abuse detected for request ${options.method} ${options.url}`)
                }
            },
        })
    }

    delete() {
        return Promise.reject('Not implemented')
    }

    exists(filename, targetDir) {
        const dir = targetDir || this.getTargetDir()
        const filepath = this.getFilepath(path.join(dir, filename))

        return this.client.repos.getContents({
            method: 'HEAD',
            owner: this.owner,
            repo: this.repo,
            ref: this.branch,
            path: filepath
        })
            .then(res => true)
            .catch(e => {
                if (e.status === 404) {
                    return false
                }

                // Just rethrow. This way, no assumptions are made about the file's status.
                throw e
            })
    }

    read(options) {
        // NOTE: Implemented to address https://github.com/ifvictr/ghost-storage-github/issues/22
        return new Promise((resolve, reject) => {
            const req = utils.getProtocolAdapter(options.path).get(options.path, res => {
                const data = []
                res.on('data', chunk => {
                    data.push(chunk)
                })
                res.on('end', () => {
                    resolve(Buffer.concat(data))
                })
            })
            req.on('error', reject)
        })
    }

    save(file, targetDir) {
        const dir = targetDir || this.getTargetDir()

        return Promise.all([
            this.getUniqueFileName(file, dir),
            readFile(file.path, 'base64') // GitHub API requires content to use base64 encoding
        ])
            .then(([filename, data]) => {
                return this.client.repos.createOrUpdateFile({
                    owner: this.owner,
                    repo: this.repo,
                    branch: this.branch,
                    message: `Create ${filename}`,
                    path: this.getFilepath(filename),
                    content: data
                })
            })
            .then(res => {
                const { path } = res.data.content
                if (this.useRelativeUrls) {
                    return `/${path}`
                }

                return this.getUrl(path)
            })
            .catch(Promise.reject)
    }

    serve() {
        // No need to serve because absolute URLs are returned
        return (req, res, next) => {
            next()
        }
    }

    getUrl(filepath) {
        const url = new URL(this.baseUrl)
        url.pathname = `${utils.removeTrailingSlashes(url.pathname)}/${filepath}`

        return url.toString()
    }

    getFilepath(filename) {
        return utils.removeLeadingSlashes(path.join(this.destination, filename))
    }
}

export default GitHubStorage
