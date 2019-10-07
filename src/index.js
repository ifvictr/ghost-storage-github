import Octokit from '@octokit/rest'
import Promise from 'bluebird'
import fs from 'fs'
import BaseStorage from 'ghost-storage-base'
import isUrl from 'is-url'
import path from 'path'
import { URL } from 'url'
import * as utils from './utils'

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

        this.branch = process.env.GHOST_GITHUB_BRANCH || branch || 'master'
        this.destination = process.env.GHOST_GITHUB_DESTINATION || destination || '/'
        this.owner = process.env.GHOST_GITHUB_OWNER || owner
        this.repo = process.env.GHOST_GITHUB_REPO || repo

        const baseUrl = utils.removeTrailingSlashes(process.env.GHOST_GITHUB_BASE_URL || config.baseUrl)
        this.baseUrl = isUrl(baseUrl)
            ? baseUrl
            : `${RAW_GITHUB_URL}/${this.owner}/${this.repo}/${this.branch}`

        const token = process.env.GHOST_GITHUB_TOKEN || config.token
        this.client = new Octokit({ auth: `token ${token}` })
    }

    delete() {
        return Promise.reject('Not implemented')
    }

    exists(filename, targetDir) {
        const filepath = path.join(targetDir || this.getTargetDir(), filename)
        return utils.isWorkingUrl(this.getUrl(filepath))
    }

    read(options) {
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
            readFile(file.path, 'base64')
        ])
            .then(([filename, data]) => {
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
