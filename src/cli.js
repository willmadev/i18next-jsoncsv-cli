import arg from "arg";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";
import csv from "csv-parser";

const parseArgsIntoOptions = (rawArgs) => {
  // arg 1 - csvToJson | jsonToCsv
  // arg 2 - original filepath
  // arg 3 - destination filepath
  const args = arg({}, { argv: rawArgs.slice(2) });

  const opts = {};

  // command
  const command = args._[0];
  console.log(command);
  if (!command || (command !== "csvToJson" && command !== "jsonToCsv")) {
    return { error: { type: "command" } };
  }
  opts.command = command;

  // original filepath
  const originalFilePath = args._[1];
  if (!originalFilePath) {
    return {
      error: { type: "original_file", message: "No original file path given" },
    };
  }
  opts.originalFilePath = originalFilePath;

  // original filepath
  const destFilePath = args._[2];
  if (!destFilePath) {
    return {
      error: { type: "dest_file", message: "No destination file path given" },
    };
  }
  opts.destFilePath = destFilePath;

  return opts;
};

const logOptError = (error) => {
  switch (error.type) {
    case "command":
      console.log("Please enter a valid command.");
      console.log("Commands: csvToJson, jsonToCsv");
      break;

    case "original_file":
      console.log("Original file error");
      console.log(error.message);
      break;

    case "dest_file":
      console.log("Destination file error");
      console.log(error.message);

    default:
      console.log("An error occured");
      break;
  }
  console.log("");
};

const jsonToCsv = async (opts) => {
  const jsonFile = JSON.parse(fs.readFileSync(opts.originalFilePath, "utf8"));

  const csvData = [];
  for (const key in jsonFile) {
    if (key) {
      let value = jsonFile[key];

      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }

      csvData.push({ key, value });
    }
  }

  const csvWriter = createObjectCsvWriter({
    path: opts.destFilePath,
    header: ["key", "value"],
  });

  await csvWriter.writeRecords(csvData);
  console.log("Created CSV File");
};

const csvToJson = async (opts) => {
  const results = [];
  fs.createReadStream(opts.originalFilePath)
    .pipe(csv({ headers: ["key", "value"] }))
    .on("data", (data) => results.push(data))
    .on("end", () => {
      console.log(results);

      let jsonObj = {};
      results.forEach((val) => {
        let { key, value } = val;
        if (value.charAt(0) === "[" && value.charAt(value.length - 1) === "]") {
          value = JSON.parse(value);
        }
        jsonObj = { [key]: value, ...jsonObj };
      });
      console.log(jsonObj);
    });
};

export function cli(rawArgs) {
  // parse args
  const opts = parseArgsIntoOptions(rawArgs);
  if (opts.error) {
    logOptError(opts.error);
    return;
  }

  // run command
  switch (opts.command) {
    case "jsonToCsv":
      jsonToCsv(opts);
      break;

    case "csvToJson":
      csvToJson(opts);
      break;

    default:
      console.log("An error occured");
      break;
  }
}
