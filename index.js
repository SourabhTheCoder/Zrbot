const TelegramBot = require('node-telegram-bot-api');

const fs = require('fs');
const path = require('path');
const request = require('request');


const AdmZip = require('adm-zip');

// Create a new bot instance
const token = process.env['token'];
const bot = new TelegramBot(token, { polling: true });

// Handle the '/start' command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to ZArchiver Bot! Send /help to see available commands.');
});

// Handle the '/help' command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Available commands:
- /createtxt: Create a text file with the provided text.
- /readtext: Read and send the text content of any file.`
  );
});




// Handle the '/unzip' command
/*bot.onText(/\/unzip/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send me the zip file you want to extract.');

  bot.on('document', (docMsg) => {
    const fileId = docMsg.document.file_id;
    const fileName = docMsg.document.file_name;

    bot.getFileLink(fileId).then((fileLink) => {
      downloadZipFile(fileLink)
        .then((zipPath) => {
          const targetFolder = path.join(__dirname, chatId.toString());
          extractFilesFromZip(zipPath, targetFolder)
            .then((extractedFiles) => {
              sendExtractedFiles(chatId, extractedFiles)
                .then(() => {
                  deleteExtractedFiles(extractedFiles);
                  bot.sendMessage(chatId, 'Extraction complete.');
                })
                .catch((error) => {
                  console.error('Failed to send extracted files:', error);
                  bot.sendMessage(chatId, 'Failed to send the extracted files.');
                });
            })
            .catch((error) => {
              console.error('Failed to extract files:', error);
              bot.sendMessage(chatId, 'Failed to extract the files.');
            })
            .finally(() => {
              deleteZipFile(zipPath);
            });
        })
        .catch((error) => {
          console.error('Failed to download the zip file:', error);
          bot.sendMessage(chatId, 'Failed to download the zip file.');
        });
    });
  });
});

// Download the zip file from URL
function downloadZipFile(fileUrl) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(__dirname, 'temp.zip');
    const fileStream = fs.createWriteStream(zipPath);

    require('request')(fileUrl)
      .pipe(fileStream)
      .on('finish', () => {
        resolve(zipPath);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Extract files from the zip archive
function extractFilesFromZip(zipPath, targetFolder) {
  return new Promise((resolve, reject) => {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    const extractedFiles = [];

    zipEntries.forEach((entry) => {
      if (!entry.isDirectory) {
        const entryPath = entry.entryName;
        const extractPath = path.join(targetFolder, entryPath);

        fs.mkdirSync(path.dirname(extractPath), { recursive: true });
        fs.writeFileSync(extractPath, entry.getData());

        extractedFiles.push(extractPath);
      }
    });

    if (extractedFiles.length > 0) {
      resolve(extractedFiles);
    } else {
      reject(new Error('No files extracted from the zip archive.'));
    }
  });
}

// Send the extracted files to the user
function sendExtractedFiles(chatId, filePaths) {
  const promises = filePaths.map((filePath) => {
    return bot.sendDocument(chatId, filePath);
  });

  return Promise.all(promises);
}

// Delete the extracted files
function deleteExtractedFiles(filePaths) {
  filePaths.forEach((filePath) => {
    fs.unlinkSync(filePath);
  });
}

// Delete the zip file
function deleteZipFile(zipPath) {
  fs.unlinkSync(zipPath);
}*/

// Handle the '/createtxt' command
bot.onText(/\/createtxt/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send me the text you want to save as a text file.');

  bot.once('message', (textMsg) => {
    if (textMsg.text) {
      askFileName(chatId, textMsg.text);
    }
  });
});

// Ask the user for a file name
function askFileName(chatId, text) {
  bot.sendMessage(chatId, 'Enter the file name for the text file or send /randomname');
  bot.once('message', (fileMsg) => {
    if (fileMsg.text) {
      if (fileMsg.text.toLowerCase() === '/randomname') {
        createTxtFile(text, null, chatId);
      } else {
        createTxtFile(text, fileMsg.text, chatId);
      }
    }
  });
}

// Create a text file with the provided text
function createTxtFile(text, fileName, chatId) {
  const txtName = fileName ? `${fileName}.txt` : `Telegram_ZArchivebot_${Date.now()}.txt`;
  const txtPath = path.join(__dirname, txtName);

  fs.writeFileSync(txtPath, text);

  bot.sendDocument(chatId, txtPath).then(() => {
    fs.unlinkSync(txtPath); // Delete the temporary text file
  });
}




// Handle the '/readtext' command
bot.onText(/\/readtext/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send me the file you want to read and send the text content.');

  const handleDocument = (docMsg) => {
    const fileId = docMsg.document.file_id;
    const fileName = docMsg.document.file_name;

    bot.getFileLink(fileId).then((fileLink) => {
      const extension = path.extname(fileName);
      if (extension) {
        readAndSendText(fileLink, extension, chatId);
      } else {
        bot.sendMessage(chatId, 'Invalid file error.');
      }
    });
  };

  bot.on('document', handleDocument);

  // Remove the 'document' event listener after the file is received
  setTimeout(() => {
    bot.removeListener('document', handleDocument);
  }, 600000); // Adjust the timeout value as needed
});

// Read and send the text content of a file
function readAndSendText(fileUrl, extension, chatId) {
  bot.sendMessage(chatId, 'Reading the file...');
 
  // You can customize the logic here based on the file extension
  // In this example, we'll simply read the file and send its content as a message

  // Assuming the file is encoded in UTF-8
  const requestOptions = {
    url: fileUrl,
    encoding: 'utf8'
  };

  // Make an HTTP request to read the file
  require('request')(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const maxMessageLength = 4050; // Telegram message length limit

      if (body.length <= maxMessageLength) {
        bot.sendMessage(chatId, `Content of the file (${extension}):\n\n${body}`);
      } else {
        const messages = splitTextIntoMessages(body, maxMessageLength);
        messages.forEach((message, index) => {
          bot.sendMessage(chatId, `Content of the file (${extension}) [Part ${index + 1}/${messages.length}]:\n\n${message}`);
        });
      }
    } else {
      bot.sendMessage(chatId, 'Failed to read the file.');
    }
  });
}

// Split the text into multiple messages based on the character limit
function splitTextIntoMessages(text, maxLength) {
  const messages = [];
  let remainingText = text;
  while (remainingText.length > maxLength) {
    const message = remainingText.substring(0, maxLength);
    messages.push(message);
    remainingText = remainingText.substring(maxLength);
  }
  messages.push(remainingText);
  return messages;
}




const express = require('express');

// Create an instance of Express
const app = express();
const port = 8080; // You can change the port number as per your requirement

// Define a route to handle GET requests for the home page
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});