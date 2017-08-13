"use strict";

const BaseStorage = require("ghost-storage-base");
const fs = require("fs");
const GitHub = require("github");
const path = require("path");
const Promise = require("bluebird");
const removeLeadingSlash = require("remove-leading-slash");
const request = Promise.promisify(require("request"));

class GitHubStorage extends BaseStorage{
    constructor(config){
        super();
        this.client = new GitHub();
        this.config = config;
    }
    
    delete(){
        return Promise.reject("Not implemented");
    }
    
    exists(filename, targetDir){
        const filepath = path.join(targetDir || this.getTargetDir(), filename);
        return request(this.getUrl(filepath))
            .then(res => {
                Promise.resolve(res.statusCode === 200);
            })
            .catch(() => {
                Promise.resolve(false);
            });
    }
    
    read(options){
    }
    
    save(file, targetDir){
        const config = this.config;
        const dir = targetDir || this.getTargetDir();
        return Promise.join(this.getUniqueFileName(file, dir), Promise.promisify(fs.readFile)(file.path, "base64"), (filename, data) => {
            // Authenticate because it only stores credentials for the next request
            this.client.authenticate({
                type: config.type,
                username: config.user,
                password: config.password,
                token: config.token,
            });
            return this.client.repos.createFile({
                owner: config.user,
                repo: config.repo,
                message: "Add new image",
                path: removeLeadingSlash(filename),
                content: data
            });
        })
            .then(res => {
                return Promise.resolve(res.data.content.download_url);
            })
            .catch(Promise.reject);
    }
    
    serve(){
        // No need to do anything, we're already returning absolute URLs
        return (req, res, next) => {
            next();
        };
    }
    
    getUrl(filename){
        const config = this.config;
        return `https://raw.githubusercontent.com/${config.user}/${config.repo}/${config.branch || "master"}/${removeLeadingSlash(filename)}`;
    }
}

module.exports = GitHubStorage;