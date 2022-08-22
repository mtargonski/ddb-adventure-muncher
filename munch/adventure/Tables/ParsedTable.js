/*
 * Some of the following code is based on MIT code by Nick Williams.
 * in addition to the MIT license used elsewhere, the appropriate lines are 
 * Copyright (c) 2014 Nick Williams
 */

const logger = require("../../logger.js");
const parseTable = require("./TableParser.js");

class ParsedTable {

  findDiceColumns() {
    let result = [];
    if (this.tableNode.tHead) {
      const headings = parseTable.getHeadings(this.tableNode);
      headings.forEach((h) => {
        const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*)?)/, "g");
        const match = h.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").match(diceRegex);
        if (match) {
          result.push(h);
        }
      });
    }
    return result;
  }

  guessTableName() {
    const hintName = this.adventure.enhancements.tableHints
      .find((hint) => hint.contentChunkId == this.contentChunkId);

    if (hintName) {
      return hintName.tableName;
    }

    const element = this.tableNode.querySelector(`table[data-content-chunk-id='${this.contentChunkId}']`);
    let track = element;
    let sibling = track.previousElementSibling;

    while (!sibling && track.parentElement && track.parentElement.nodeName === "DIV") {
      if (!track.parentElement.previousElementSibling) {
        track = track.parentElement;
      } else {
        sibling = track.parentElement.previousElementSibling;
      }
    }

    if (sibling) {
      logger.debug(sibling.textContent);
      return sibling.textContent;
    } else {
      logger.warn(`No table name identified for ${this.contentChunkId}`);
      return `${this.tableNode.name}: Unknown Table: ${this.contentChunkId}`;
    }
  }

  #logInfo(tableNode) {
    logger.debug("***********************************************");
    logger.debug("Table detection!");
    logger.info(`Table: "${this.nameGuess}"`);
    logger.debug(`ContentChunkId: ${this.contentChunkId}`);
    logger.info(`Dice Keys: ${this.diceKeys.join(", ")}`);
    logger.info(`Keys: ${this.keys.join(", ")}`);
    logger.debug("***********************************************");

    if (this.adventure.config.tableDebug) {
      if (this.adventure.config.debug) logger.debug(tableNode.outerHTML);
      if (this.adventure.config.debug && this.parsedTable) logger.debug(this.parsedTable);
      // if (parsedTable) logger.info(parsedTable);
      logger.info("***********************************************");
    }
  }

  constructor(adventure, tableNode) {
    this.adventure = adventure;

    // this takes the html of a table and breaks it up so we can use it
    // into arrays
    this.parsedTable = parseTable.parseTable(tableNode);
    this.keys = parseTable.getHeadings(tableNode);
    this.diceKeys = this.findDiceColumns();
    this.contentChunkId = tableNode.getAttribute("data-content-chunk-id");
    this.nameGuess = this.guessTableName();

    if (this.nameGuess.split(" ").length > 5 && this.diceKeys.length === 1 && this.keys.length === 2) {
      this.nameGuess = this.keys[1];
    }

    this.#logInfo(tableNode);
    this.tableMatched();

  }

  tableMatched() {
    if (this.adventure.config.tableFind) {
      this.adventure.tableMatched.push({
        // foundryId: ,
        nameGuess: this.nameGuess,
        length: this.parsedTable.length,
        keys: this.keys,
        diceKeys: this.diceKeys,
        diceTable: this.diceKeys.length > 0,
        multiDiceKeys: this.diceKeys.length > 1,
        diceKeysNumber: this.diceKeys.length,
        totalKeys: this.keys.length,
        journal: this.journal.name,
        id: this.tableNode.id,
        class: this.tableNode.class,
        contentChunkId: this.contentChunkId,
      });
    }
  }

}

exports.ParsedTable = ParsedTable;


