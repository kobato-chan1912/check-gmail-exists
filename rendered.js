const $ = require('jquery')
const checkMailModule = require("./check.js")
const fs = require("fs");
const pLimit = require("p-limit");
const { ipcRenderer, webUtils } = require('electron');


async function selectOutput(defaultName) {
    const filePath = await ipcRenderer.invoke('dialog:saveFile', defaultName);
    if (filePath) {
      return filePath
    } else {
      return null
    }
  }

function createMail() {
    let firstNames = $("#firstName").val().split("\n").filter(name => name.trim() !== "");
    let lastNames = $("#lastName").val().split("\n").filter(name => name.trim() !== "");
    let maxMails = parseInt($("#maxMail").val()) || 10;
    
    let generatedMails = [];
    
    for (let i = 0; i < firstNames.length; i++) {
        for (let j = 0; j < lastNames.length; j++) {
            let email = `${firstNames[i].trim()}${lastNames[j].trim()}@gmail.com`;
            generatedMails.push(email);
            if (generatedMails.length >= maxMails) {
                break;
            }
        }
        if (generatedMails.length >= maxMails) {
            break;
        }
    }

    // Shuffle Array 
    for (let i = generatedMails.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [generatedMails[i], generatedMails[j]] = [generatedMails[j], generatedMails[i]];
    }


    $("#random").val(generatedMails.join("\n"));
}


async function checkMail() {

  

    let emails = $("#random").val().split("\n").filter(email => email.trim() !== "");

    if (emails.length === 0) {
        alert("Vui lòng tạo email trước khi kiểm tra!");
        return;
    }

    let fileName = "output.txt";
    let savePath = await selectOutput(fileName)
    if (savePath == null) {
      alert("Vui lòng chọn nơi lưu file txt!")
      return;
    }


    let checkButton = $("#checkMailBtn");
    let originalText = checkButton.html(); 
    checkButton.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang kiểm tra...`);


    let validEmails = [];


    let threadCount = parseInt($("#threads").val()) || 1;
    isChecking = true; 
    $("#stopNow").show();

    let limit = pLimit(threadCount);

    const tasks = emails.map(email => limit(async () => {
        if (!isChecking) return; // Kiểm tra nếu bị dừng thì bỏ qua email này

        let isValid = await checkMailModule.checkGmailExists(email);
        if (isValid) {
            let [firstName, lastName] = email.replace("@gmail.com", "").split(/(?=[A-Z])/);
            let emailString = `${firstName},${lastName},${email.toLowerCase()}`;
            validEmails.push(emailString);
            $("#live").val(validEmails.join("\n"));
        }
    }));

    await Promise.all(tasks);

    if (validEmails.length > 0) {
        fs.writeFileSync(savePath, validEmails.join("\n"), "utf-8");
        alert("Đã lưu các email hợp lệ vào output.txt");
    } else {
        alert("Không có email nào hợp lệ!");
    }

    
    checkButton.prop("disabled", false).html(originalText);
    $("#stopNow").hide(); // 

}

function stopNow() {
    if (confirm("Bạn có chắc chắn muốn dừng kiểm tra email không?")) {
        isChecking = false;
        $("#stopNow").hide(); // 
        $("#checkMailBtn").html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang dừng lại...`);
    }
}
