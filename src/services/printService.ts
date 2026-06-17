// ../services/printService.ts
import QRCode from 'qrcode';

interface PrintFlierPayload {
  headline: string;
  universalTitle: string;
  universalDesc: string;
  manualTitle: string;
  manualDescLink: string;
  manualDescCode: string;
  accessCode: string;
  buildingId: string;
  logoHtml: string;
}

export async function printLaundryFlier(data: PrintFlierPayload) {
  try {
    // This is the clean destination link that handles routing
    const landingPageDomain = "your-laundry-app.com";
    const routingUrl = `https://${landingPageDomain}/join?b=${data.buildingId}&c=${data.accessCode}`;

    const universalQrUrl = await QRCode.toDataURL(routingUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please disable your popup blocker to generate the print flier sheet.");
      return;
    }

    printWindow.document.title = data.headline;

    const styleElement = printWindow.document.createElement('style');
    styleElement.textContent = `
      @page { size: A4 portrait; margin: 15mm; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #000000;
        background: #ffffff;
        text-align: center;
        padding: 0;
        margin: 0;
      }
      .container {
        border: 4px double #3880ff;
        border-radius: 24px;
        padding: 35px 25px;
        max-width: 750px;
        margin: 0 auto;
        box-sizing: border-box;
      }
      .app-logo-center-frame {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 12px;
      }
      .app-logo-center-frame div {
        position: static !important;
        opacity: 1 !important;
        display: block !important;
      }
      .app-logo-center-frame svg {
        width: 85px !important;
        height: 85px !important;
      }
      h1 {
        font-size: 30px;
        font-weight: 800;
        color: #1a1a1a;
        margin-top: 0;
        margin-bottom: 30px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .section {
        margin-bottom: 30px;
        padding: 20px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .manual-footer-section {
        padding: 25px 20px;
        background: #fffbeb;
        border: 2px dashed #f59e0b;
        border-radius: 16px;
        text-align: left; /* Left align for multi-step readability */
      }
      .footer-step {
        margin-bottom: 18px;
      }
      .footer-step:last-child {
        margin-bottom: 0;
        text-align: center; /* Re-center the final big code box */
      }
      h2 {
        font-size: 20px;
        font-weight: 700;
        color: #3880ff;
        margin-top: 0;
        margin-bottom: 10px;
      }
      h2.warning-title {
        color: #d97706;
        text-align: center;
        margin-bottom: 20px;
        font-size: 22px;
      }
      h3 {
        font-size: 15px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 6px 0;
      }
      p {
        font-size: 13.5px;
        color: #4a5568;
        line-height: 1.5;
        margin: 0 0 10px 0;
      }
      .qr-image {
        width: 220px;
        height: 220px;
        padding: 10px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 16px;
        display: block;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        margin: 10px auto 0 auto;
      }
      .url-text {
        font-family: monospace;
        font-size: 18px;
        font-weight: 700;
        color: #3880ff;
        background: #ffffff;
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid #fde68a;
        display: inline-block;
      }
      .code-box {
        font-family: "Courier New", Courier, monospace;
        font-size: 38px;
        font-weight: 800;
        letter-spacing: 8px;
        background: #ffffff;
        border: 2px solid #1a1a1a;
        padding: 10px 30px;
        display: inline-block;
        border-radius: 12px;
        margin-top: 4px;
        color: #000000;
      }
    `;
    printWindow.document.head.appendChild(styleElement);

    const containerElement = printWindow.document.createElement('div');
    containerElement.className = 'container';
    containerElement.innerHTML = `
      <div class="app-logo-center-frame">
        ${data.logoHtml}
      </div>

      <h1>${data.headline}</h1>
      
      <!-- MAIN QR SECTION -->
      <div class="section">
        <h2>${data.universalTitle}</h2>
        <p style="text-align: center; max-width: 600px;">${data.universalDesc}</p>
        <img src="${universalQrUrl}" class="qr-image" alt="Scan to Start" />
      </div>
      
      <!-- DETAILED MANUAL ACCESS FALLBACK CARD -->
      <div class="manual-footer-section">
        <h2 class="warning-title">${data.manualTitle}</h2>
        
        <!-- Step 1: Manual Link -->
        <div class="footer-step">
          <h3>${data.manualDescLink}</h3>
          <div class="url-text">${landingPageDomain}</div>
        </div>

        <!-- Step 2: Manual Code -->
        <div class="footer-step">
          <h3>${data.manualDescCode}</h3>
          <div class="code-box">${data.accessCode}</div>
        </div>
      </div>
    `;
    printWindow.document.body.appendChild(containerElement);

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

  } catch (error) {
    console.error("Local Unified QR Code Print generation failed:", error);
  }
}
