const puppeteer = require("puppeteer");
const sleep = ms => new Promise(res => setTimeout(res, ms));
const os = require('os');

async function checkGmailExists(email) {

    let browserOptions = {
        headless: true,  // Hoặc có thể thử headless: false để kiểm tra
        args: [
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
            '--window-size=1200,800',
        ],
    };


    
    if (os.platform() === 'win32') {
        browserOptions.executablePath = path.join(__dirname, 'chrome', 'chrome.exe');
    }


    const browser = await puppeteer.launch(browserOptions);
        const page = await browser.newPage();

  try {
    await page.goto("https://accounts.google.com", {
      waitUntil: "networkidle2",
    });

    // Nhập email vào ô input
    await page.type('input[type="email"]', email);
    await page.click("#identifierNext"); // Click vào nút "Tiếp theo"

    // Chờ phản hồi từ trang
    await sleep(3000);

    // Kiểm tra sự tồn tại của class `.dEOOab`
    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector(".dEOOab");
      return errorElement ? errorElement.innerText.trim() : null;
    });

    

    await browser.close();

    if (errorMessage == null){
        return true;
    }

    return false;

} catch (error) {
    console.error("Lỗi:", error);
    await browser.close();
    return false;
  }
}

module.exports = { checkGmailExists }