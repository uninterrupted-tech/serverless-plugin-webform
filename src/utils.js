import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import { minify } from "minify";
import { dirname } from "path";
import { fileURLToPath } from "url";

export const readFileToStringAsync = async (path) => {
  try {
    return readFile(path, { encoding: "utf8" });
  } catch (err) {
    throw new Error(`An error occurred while reading the file: ${err}`);
  }
};

export const readFileToString = (path) => {
  return readFileSync(path, "utf8", (err, data) => {
    if (err) {
      throw new Error(`An error occurred while reading the file: ${err}`);
    }
    return data;
  });
};

export const getDirName = (path) => {
  return dirname(fileURLToPath(path));
};

export const minifyHTML = async (file) => {
  return minify(file, { html: true }).catch((err) => {
    throw new Error(err);
  });
};
