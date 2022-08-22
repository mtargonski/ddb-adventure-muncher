const logger = require("../logger.js");
const { FileHelper } = require("./FileHelper.js");

const fs = require("fs");
const fse = require("fse");
const path = require("path");

class Assets {

  constructor(adventure) {
    this.adventure = adventure;
  }

  async downloadEnhancements(list) {
    logger.info("Checking for download enhancements...");
    const disableLargeDownloads = this.adventure.config.disableLargeDownloads ? 
      this.adventure.config.disableLargeDownloads :
      false;
    if (!disableLargeDownloads) {
      let dlFile = FileHelper.loadFile(path.join(this.adventure.config.run.sourceDir, "hiRes.json"));
      let downloaded = dlFile ? JSON.parse(dlFile) : [];
      if (!Array.isArray(downloaded)) downloaded = [];
      for (let i = 0; i < list.length; i++) {
        const listPath = list[i].path.replace(/^assets\//, "");
        if (!downloaded.includes(listPath)) {
          const dlPath = path.join(this.adventure.config.run.sourceDir, listPath);
          logger.info(`Downloading Hi Res ${list[i].name} (${dlPath})`);
          await FileHelper.downloadFile(list[i].url, dlPath, this.adventure.config.run.downloadTimeout);
          downloaded.push(listPath);
        }
      }
      FileHelper.saveJSONFile(downloaded, path.join(this.adventure.config.run.sourceDir, "hiRes.json"));
    }
  }

  async downloadDDBMobile() {
    logger.info("Checking for missing ddb images...");
    const targetFilesFile = FileHelper.loadFile(path.join(this.adventure.config.run.sourceDir, "files.txt"));
    const targetFiles = targetFilesFile ? JSON.parse(targetFilesFile) : {};
  
    if (targetFiles.files) {
      const list = targetFiles.files;
      for (let i = 0; i < list.length; i++) {
        const localUrl = list[i].LocalUrl[0].replace(/^\//,"");
        const dlPath = path.join(this.adventure.config.run.sourceDir, localUrl);
        const isLocalFile = fs.existsSync(dlPath);
        if (!isLocalFile) {
          logger.info(`Downloading DDB Image ${localUrl} (${dlPath})`);
          await FileHelper.downloadFile(list[i].RemoteUrl, dlPath, this.adventure.config.run.downloadTimeout);
          if (list[i].LocalUrl.length > 1) {
            for (let ui = 0; ui < list[i].LocalUrl.length; ui++) {
              const targetUrl = list[i].LocalUrl[ui].replace(/^\//,"");
              if (localUrl !== targetUrl) {
                logger.info(`Copying ${localUrl} to ${targetUrl}`);
                fse.copySync(dlPath, path.join(this.adventure.config.run.sourceDir,targetUrl));
              }
            }
          }
        }
      }
    }
  }

  finalAssetCopy() {
    // To copy a folder or file
    fse.copySync(this.adventure.config.run.sourceDir, path.join(this.adventure.config.run.outputDir,"assets"));
  
    // copy assets files
    const assetFilePath = path.join(this.adventure.config.run.assetsInfoDir, this.adventure.config.run.bookCode);
    if (fs.existsSync(assetFilePath)) {
      fse.copySync(assetFilePath, path.join(this.adventure.config.run.outputDir,"assets"));
    }
  
    const copiedDbPath = path.join(this.adventure.config.run.outputDir,"assets",`${this.adventure.bookCode}.db3`);
    logger.info(copiedDbPath);
    if (fs.existsSync(copiedDbPath)) {
      try {
        fs.unlinkSync(copiedDbPath);
        //file removed
      } catch(err) {
        logger.error(err);
      }
    }
  }

  generateZipFile() {
    logger.info("Generating adventure zip...");
    const zip = FileHelper.getZipOfFolder(this.adventure.config.run.outputDir);
    FileHelper.writeZipFile(zip, path.join(this.adventure.config.run.outputDirEnv,`${this.adventure.bookCode}.fvttadv`));
  }

}

exports.Assets = Assets;
