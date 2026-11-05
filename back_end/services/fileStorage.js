const { randomUUID } = require("crypto");
const { mkdir, readFile, unlink, writeFile } = require("fs/promises");
const path = require("path");

const storageRoot = path.resolve(__dirname, "..", "private_uploads");

async function detectFileType(buffer) {
  const { fileTypeFromBuffer } = await import("file-type");
  return fileTypeFromBuffer(buffer);
}

async function savePrivateFile(buffer, category, allowedMimeTypes) {
  const detected = await detectFileType(buffer);
  if (!detected || !allowedMimeTypes.includes(detected.mime)) {
    const error = new Error("The file contents do not match an allowed file type.");
    error.status = 400;
    throw error;
  }

  const directory = path.join(storageRoot, category);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const storageName = `${randomUUID()}.${detected.ext}`;
  const fullPath = path.join(directory, storageName);
  await writeFile(fullPath, buffer, { flag: "wx", mode: 0o600 });
  return { storageName, mimeType: detected.mime, fullPath };
}

function getPrivateFilePath(category, storageName) {
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/i.test(storageName || "")) {
    throw new Error("Invalid stored file reference.");
  }
  return path.join(storageRoot, category, storageName);
}

async function readPrivateFile(category, storageName) {
  const fullPath = getPrivateFilePath(category, storageName);
  return { buffer: await readFile(fullPath), fullPath };
}

async function deletePrivateFile(category, storageName) {
  if (!storageName) return;
  await unlink(getPrivateFilePath(category, storageName)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

module.exports = { deletePrivateFile, getPrivateFilePath, readPrivateFile, savePrivateFile };