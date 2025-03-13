const $ = require('jquery')
const fs = require("fs");
const path = require("path");
const pLimit = require("p-limit");
const { ipcRenderer, webUtils } = require('electron');
const os = require('os');
const validator = require("deep-email-validator")





function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}





async function selectOutput(defaultName) {
    const filePath = await ipcRenderer.invoke('dialog:saveFile', defaultName);
    if (filePath) {
        return filePath
    } else {
        return null
    }
}


let firstNames = [];
let lastNames = [];
function readNameFiles() {
    // Định nghĩa đường dẫn file
    const firstNamePath = path.join("file_ho_ten", "FirstName.txt");
    const lastNamePath = path.join("file_ho_ten", "LastName.txt");

    // Kiểm tra file tồn tại trước khi đọc
    if (fs.existsSync(firstNamePath)) {
        firstNames = fs.readFileSync(firstNamePath, "utf8")
            .split("\n")
            .map(name => name.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))
            .filter(name => name !== "");
    } else {
        console.error("Không tìm thấy FirstName.txt");
        firstNames = [];
    }

    if (fs.existsSync(lastNamePath)) {
        lastNames = fs.readFileSync(lastNamePath, "utf8")
            .split("\n")
            .map(name => name.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))
            .filter(name => name !== "");
    } else {
        console.error("Không tìm thấy LastName.txt");
        lastNames = [];
    }
}

function createMail() {

    readNameFiles()

    let maxMails = parseInt($("#maxMail").val()) || 10;

    if (firstNames.length === 0 || lastNames.length === 0) {
        alert("Danh sách họ hoặc tên không được để trống!");
        return;
    }

    let generatedMails = new Set();

    while (generatedMails.size < maxMails) {
        let randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
        let randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];

        let startNumber = $("#start_number").val()
        let endNumber = $("#end_number").val()
        let randomNumber = ''

        if (startNumber !== '' && endNumber !== '') {
            randomNumber = randomInteger(parseInt(startNumber), parseInt(endNumber))
        }

        let email = `${randomFirst}${randomLast}${randomNumber}@gmail.com`;

        generatedMails.add(email);
    }

    $("#random").val([...generatedMails].join("\n"));
}




async function checkMail() {
    let checkButton = $("#checkMailBtn");
    let originalText = checkButton.html();
    checkButton.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang đọc file...`);

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




    checkButton.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang kiểm tra...`);


    let validEmails = [];
    let notLiveEmails = [];


    let threadCount = parseInt($("#threads").val()) || 1;
    isChecking = true;
    $("#stopNow").show();

    let limit = pLimit(threadCount);

    const tasks = emails.map(email => limit(async () => {
        if (!isChecking) return; // Kiểm tra nếu bị dừng thì bỏ qua email này

        let isValidCheck = await validator.validate(email);
        let isValid = isValidCheck.valid;
        let [firstName, lastName] = email.replace("@gmail.com", "").split(/(?=[A-Z])/);
        

        let nameString = `${firstName},${lastName}`;
        nameString = nameString.replace(/\d+/g, ''); // Loại bỏ tất cả các số
        let emailString = `${nameString},${email.toLowerCase()}`;

        if (isValid) {
            validEmails.push(emailString);
            $("#live").val(validEmails.join("\n"));
            $("#live_count").html(validEmails.length)
        } else {
            notLiveEmails.push(emailString);
            $("#not_live").val(notLiveEmails.join("\n"));
            $("#not_live_count").html(notLiveEmails.length)
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
