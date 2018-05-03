"use strict";

const Promise = require("bluebird");
const BaseStorage = require("ghost-storage-base");
const Octokit = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const buildUrl = require("build-url");
const isUrl = require("is-url");
const readFile = Promise.promisify(fs.readFile);
const removeLeadingSlash = require("remove-leading-slash");
const request = Promise.promisify(require("request"));

class GitHubStorage extends BaseStorage {
    constructor(config) {
        super();

        this.client = new Octokit();
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

    delete() {
        // TODO: Find a way to get the blob SHA of the target file
        return Promise.reject("Not implemented");
    }

    exists(filename, targetDir) {
        const filepath = path.join(targetDir || this.getTargetDir(), filename);

        return request(this.getUrl(filepath))
            .then(res => res.statusCode === 200)
            .catch(() => false);
    }

    read(options) {
        // Not needed because absolute URLS are already used to link to the images
    }

    save(file, targetDir) {
        const {baseUrl, branch, repo, user} = this.config;
        const dir = targetDir || this.getTargetDir();

        return Promise.join(this.getUniqueFileName(file, dir), readFile(file.path, "base64"), (filename, data) => {
            return this.client.repos.createFile({
                owner: user,
                repo: repo,
                branch: branch,
                message: "Add new image",
                path: this.getFilepath(filename),
                content: data
            });
        })
        .then(res => {
            console.log(res);
            return res.data.content.download_url;
        })
        .catch(Promise.reject);
    }

    serve() {
        return (req, res, next) => {
            next();
        };
    }

    getUrl(filename) {
        const {baseUrl, branch, repo, user} = this.config;
        let url = isUrl(baseUrl) ? baseUrl : `https://raw.githubusercontent.com/${user}/${repo}/${branch}`;
        url = buildUrl(url, {path: this.getFilepath(filename)});

        return url;
    }

    getFilepath(filename) {
        return removeLeadingSlash(path.join(this.config.destination, filename));
    }
}

module.exports = GitHubStorage;