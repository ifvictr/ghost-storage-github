import Promise from 'bluebird'
import fs from 'fs'
import BaseStorage from 'ghost-storage-base'
import GitHub from 'github'
import isUrl from 'is-url'
import path from 'path'
import removeLeadingSlash from 'remove-leading-slash'
import _request from 'request'

const readFile = Promise.promisify(fs.readFile)
const request = Promise.promisify(_request)

class GitHubStorage extends BaseStorage {
    constructor(config) {
        super()

        this.client = new GitHub()
        this.config = {
            branch: 'master',
            destination: '',
            ...config
        }

        this.client.authenticate({
            type: this.config.type,
            username: this.config.user,
            password: this.config.password,
            token: this.config.token,
        })
    }

    delete() {
        // TODO: Find a way to get the blob SHA of the target file
        return Promise.reject('Not implemented')
    }

    exists(filename, targetDir) {
        const filepath = path.join(targetDir || this.getTargetDir(), filename)

        return request(this.getUrl(filepath))
            .then(res => res.statusCode === 200)
            .catch(() => false)
    }

    read(options) {
        // Not needed because absolute URLS are already used to link to the images
    }

    save(file, targetDir) {
        const { branch, repo, user } = this.config
        const dir = targetDir || this.getTargetDir()

        return Promise.join(this.getUniqueFileName(file, dir), readFile(file.path, 'base64'), (filename, data) => {
            return this.client.repos.createFile({
                owner: user,
                repo: repo,
                branch: branch,
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
        const { baseUrl, branch, repo, user } = this.config
        const rootUrl = isUrl(baseUrl)
            ? baseUrl
            : `https://raw.githubusercontent.com/${user}/${repo}/${branch}`

        const url = new URL(rootUrl);
        url.pathname = this.getFilepath(filename);

        return url.toString()
    }

    getFilepath(filename) {
        return removeLeadingSlash(path.join(this.config.destination, filename))
    }
}

export default GitHubStorage