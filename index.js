const keep_alive = require('./keep_alive.js');
const fs = require('fs').promises;
require('dotenv').config();

async function fetchRandomScript(query, mode) {
  const fetch = await import('node-fetch');
  const page = Math.floor(Math.random() * 10) + 1;
  const apiUrl = `https://scriptblox.com/api/script/search?q=${query}&mode=${mode}&page=${page}`;

  try {
    const response = await fetch.default(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch script. Status: ${response.status}`);
    }
    const data = await response.json();
    const scripts = data?.result?.scripts || [];
    if (scripts.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * scripts.length);
    return scripts[randomIndex];
  } catch (error) {
    if (error.message.includes('No scripts found')) {
      throw new Error('No scripts found for query');
    } else {
      throw error;
    }
  }
}

function createEmbed(script) {
  const embed = {
    title: script.title,
    description: script.script,
    color: 0x206694,
    fields: [
      { name: 'Game', value: `[${script.game.name}](https://www.roblox.com/games/${script.game.gameId})`, inline: true },
      { name: 'Verified', value: script.verified ? '✅ Verified' : '❌ Not Verified', inline: true },
      { name: 'ScriptType', value: script.scriptType === 'free' ? 'Free' : '💲 Paid', inline: true },
      { name: 'Universal', value: script.isUniversal ? '🌐 Universal' : 'Not Universal', inline: true },
      { name: 'Views', value: `👁️ ${script.views}`, inline: true },
      { name: 'Key', value: script.keyLink ? `[Key Link](${script.keyLink})` : script.key ? '🔑 Has Key' : '✅ No Key', inline: true },
      { name: 'Patched', value: script.isPatched ? '❌ Patched' : '✅ Not Patched', inline: true },
      { name: 'Links', value: `[Raw Script](https://rawscripts.net/raw/${script.slug}) - [Script Page](https://scriptblox.com/script/${script.slug})`, inline: false },
      { name: 'The Script', value: '```lua\n' + (script.script.length > 200 ? script.script.substring(0, 200) + '...' : script.script) + '\n```', inline: false },
      { name: 'Timestamps', value: `**Created At:** ${script.createdAt}\n**Updated At:** ${script.updatedAt}`, inline: false }
    ],
    footer: {
      text: 'Made by Xero | Powered by Scriptblox',
      icon_url: 'https://media.discordapp.net/attachments/1144293399453894747'
    }
  };

  if (script.game.imageUrl) {
    embed.image = { url: `https://scriptblox.com${script.game.imageUrl}` };
  } else {
    embed.image = { url: 'https://c.tenor.com/jnINmQlMNbsAAAAC/tenor.gif' };
  }

  return embed;
}

function sendScriptWebhook(webhookUrl, embed) {
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ embeds: [embed] }),
  })
    .then(response => {
      if (response.ok) {
        console.log("Script sent successfully to webhook.");
      } else {
        console.error("Failed to send script to webhook. Response code:", response.status);
      }
    })
    .catch(error => {
      console.error("Error sending script to webhook:", error);
    });
}

async function getRandomGameFromFile(filePath) {
  try {
    const gamesData = await fs.readFile(filePath, 'utf-8');
    const gamesList = gamesData.trim().split('\n');
    const randomIndex = Math.floor(Math.random() * gamesList.length);
    return gamesList[randomIndex].trim();
  } catch (error) {
    console.error("Error reading games file:", error);
    throw error;
  }
}

async function main() {
  try {
    const gamesFile = 'games.txt'; 
    const webhookUrl = process.env.WEBHOOK_URL; 

    let script = null;
    while (!script) {
      const query = await getRandomGameFromFile(gamesFile);
      const mode = Math.random() < 0.5 ? 'free' : 'paid'; 
      try {
        script = await fetchRandomScript(query, mode);
      } catch (error) {
        if (error.message === 'No scripts found for query') {
          console.warn(`No scripts found for query: ${query}, mode: ${mode}. Retrying with another query...`);
        } else {
          throw error;
        }
      }
    }

    const embed = createEmbed(script);
    sendScriptWebhook(webhookUrl, embed);

    setInterval(async () => {
      let script = null;
      while (!script) {
        const query = await getRandomGameFromFile(gamesFile);
        const mode = Math.random() < 0.5 ? 'free' : 'paid'; 
        try {
          script = await fetchRandomScript(query, mode);
        } catch (error) {
          if (error.message === 'No scripts found for query') {
            console.warn(`No scripts found for query: ${query}, mode: ${mode}. Retrying with another query...`);
          } else {
            throw error;
          }
        }
      }

      const embed = createEmbed(script);
      sendScriptWebhook(webhookUrl, embed);
    }, 5 * 60 * 1000); 
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
