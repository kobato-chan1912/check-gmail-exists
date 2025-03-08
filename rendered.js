const $ = require('jquery')
const checkMailModule = require("./check.js")
const fs = require("fs");
const path = require("path");
const pLimit = require("p-limit");
const { ipcRenderer, webUtils } = require('electron');
const os = require('os');

$(document).ready(function () {
    // Định nghĩa đường dẫn file
    const firstNamePath = path.join( "file_ho_ten", "FirstName.txt");
    const lastNamePath = path.join( "file_ho_ten" , "LastName.txt");

    // Đọc FirstName.txt
    fs.readFile(firstNamePath, "utf8", (err, data) => {
        if (!err) {
            $("#firstName").val(data.trim());
        } else {
            console.error("Không thể đọc FirstName.txt", err);
        }
    });

    // Đọc LastName.txt
    fs.readFile(lastNamePath, "utf8", (err, data) => {
        if (!err) {
            $("#lastName").val(data.trim());
        } else {
            console.error("Không thể đọc LastName.txt", err);
        }
    });
});






async function selectOutput(defaultName) {
    const filePath = await ipcRenderer.invoke('dialog:saveFile', defaultName);
    if (filePath) {
        return filePath
    } else {
        return null
    }
}

function createMail() {
    let firstNames = $("#firstName").val().split("\n")
        .map(name => name.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))
        .filter(name => name !== "");

    let lastNames = $("#lastName").val().split("\n")
        .map(name => name.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))
        .filter(name => name !== "");

    let maxMails = parseInt($("#maxMail").val()) || 10;

    if (firstNames.length === 0 || lastNames.length === 0) {
        alert("Danh sách họ hoặc tên không được để trống!");
        return;
    }

    let generatedMails = new Set();

    while (generatedMails.size < maxMails) {
        let randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
        let randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];

        let email = `${randomFirst}${randomLast}@gmail.com`;

        generatedMails.add(email);
    }

    $("#random").val([...generatedMails].join("\n"));
}




async function checkMail() {

    createMail();


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
    let notLiveEmails = [];


    let threadCount = parseInt($("#threads").val()) || 1;
    isChecking = true;
    $("#stopNow").show();

    let limit = pLimit(threadCount);

    const tasks = emails.map(email => limit(async () => {
        if (!isChecking) return; // Kiểm tra nếu bị dừng thì bỏ qua email này

        let isValid = await checkMailModule.checkGmailExists(email);
        let [firstName, lastName] = email.replace("@gmail.com", "").split(/(?=[A-Z])/);
        let emailString = `${firstName},${lastName},${email.toLowerCase()}`;

        if (isValid) {
            validEmails.push(emailString);
            $("#live").val(validEmails.join("\n"));
        } else {
            notLiveEmails.push(emailString);
            $("#not_live").val(validEmails.join("\n"));
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
