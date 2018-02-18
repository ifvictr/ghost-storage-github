"use strict";

const Promise = require("bluebird");
const BaseStorage = require("ghost-storage-base");
const GitHub = require("github");
const fs = require("fs");
const path = require("path");

const buildUrl = require("build-url");
const isUrl = require("is-url");
const removeLeadingSlash = require("remove-leading-slash");
const request = Promise.promisify(require("request"));

class GitHubStorage extends BaseStorage {
    /**
     * @param {Object} config
     */
    constructor(config) {
        super();

        this.client = new GitHub();
        this.config = config;
        config.branch = config.branch || "master";
        config.destination = config.destination || "";

        this.client.authenticate({
            type: config.type,
            username: config.user,
            password: config.password,
            token: config.token,
        });
    }

    /**
     * Not implemented yet.
     * @todo Find a way to get the blob SHA of the target file
     * @returns {Promise.<*>}
     */
    delete() {
        return Promise.reject("Not implemented");
    }

    /**
     * @param {string} filename
     * @param {string} targetDir
     * @returns {Promise}
     */
    exists(filename, targetDir) {
        const filepath = path.join(targetDir || this.getTargetDir(), filename);

        return request(this.getUrl(filepath))
            .then(res => res.statusCode === 200)
            .catch(() => false);
    }

    /**
     * Doesn't need to be implemented because URLs are used to refer to images.
     * @param {Object} options
     */
    read(options) {}

    /**
     * @param {Object} file
     * @param {string} targetDir
     * @returns {Promise}
     */
    save(file, targetDir) {
        const {branch, repo, user} = this.config;
        const dir = targetDir || this.getTargetDir();

        return Promise.join(this.getUniqueFileName(file, dir), Promise.promisify(fs.readFile)(file.path, "base64"), (filename, data) => {
            return this.client.repos.createFile({
                owner: user,
                repo: repo,
                branch: branch,
                message: "Add new image",
                path: this.getFilepath(filename),
                content: data
            });
        })
            .then(res => res.data.content.download_url)
            .catch(Promise.reject);
    }

    /**
     * @returns {function}
     */
    serve() {
        return (req, res, next) => {
            next();
        };
    }

    /**
     * @param {string} filename
     * @returns {string}
     */
    getUrl(filename) {
        const {baseUrl, branch, repo, user} = this.config;
        let url = isUrl(baseUrl) ? baseUrl : `https://raw.githubusercontent.com/${user}/${repo}/${branch}`;
        url = buildUrl(url, {path: this.getFilepath(filename)});

        return url;
    }

    /**
     * @param {string} filename
     * @returns {string}
     */
    getFilepath(filename) {
        return removeLeadingSlash(path.join(this.config.destination, filename));
    }
}

module.exports = GitHubStorage;