const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

/**
 * Function to check and apply updates from GitHub
 */
async function checkForUpdates(conn, from, message) {
    try {
        const githubToken = "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";
        const repoURL = "https://api.github.com/repos/SILENTLOVER40/SILENT-SOBX-MD/commits";

        // Fetch latest commit from GitHub
        const latestCommitResponse = await axios.get(repoURL, {
            headers: {
                Authorization: `token ${githubToken}`
            }
        });
        const latestCommitSHA = latestCommitResponse.data[0].sha;

        // Fetch files changed in the latest commit
        const commitDetailsURL = `https://api.github.com/repos/SILENTLOVER40/SILENT-SOBX-MD/commits/${latestCommitSHA}`;
        const commitDetailsResponse = await axios.get(commitDetailsURL, {
            headers: {
                Authorization: `token ${githubToken}`
            }
        });
        const changedFiles = commitDetailsResponse.data.files.map(file => file.filename);

        console.log("Changed files:", changedFiles);

        // Read the last applied commit
        let currentCommitSHA = '';
        try {
            currentCommitSHA = await fs.readFile("./current_commit.txt", "utf8");
        } catch {
            console.log("No current_commit.txt found, assuming first run.");
        }

        // Check if the bot is up-to-date
        if (latestCommitSHA !== currentCommitSHA) {
            await conn.sendMessage(from, { text: "♻️ Wait for update started......" }, { quoted: message });

            // Update files in the `plugins` folder
            for (const file of changedFiles) {
                if (file.startsWith("plugins/")) {
                    const localPath = path.join("./", file);
                    await downloadAndUpdateFile(latestCommitSHA, file, localPath);
                }
            }

            // Update other specific files
            const filesToUpdate = ["config.js", "command.js", "index.js"]; // Added index.js
            for (const file of filesToUpdate) {
                if (changedFiles.includes(file)) {
                        await downloadAndUpdateFile(latestCommitSHA, file, `./${file}`);
                            }
                            }

            await conn.sendMessage(from, { text: "✅ Update Completed!" }, { quoted: message });

            // Save the latest commit SHA
            await fs.writeFile("./current_commit.txt", latestCommitSHA, "utf8");
        } else {
            await conn.sendMessage(from, { text: "✅ You are using the latest version of the bot." }, { quoted: message });
        }
    } catch (error) {
        console.error("Error checking for updates:", error.message);
        await conn.sendMessage(from, { text: "⚠️ Error: Unable to check for updates." }, { quoted: message });
    }
}

/**
 * Helper function to download and update a file
 */
async function downloadAndUpdateFile(commitSHA, fileName, savePath) {
    try {
        const fileURL = `https://raw.githubusercontent.com/SILENTLOVER40/SILENT-SOBX-MD/${commitSHA}/${fileName}`;
        const response = await axios.get(fileURL);
        await fs.writeFile(savePath, response.data, "utf8");
        console.log(`Updated: ${fileName}`);
    } catch (error) {
        console.error(`Error updating ${fileName}:`, error.message);
    }
}

module.exports = { checkForUpdates };