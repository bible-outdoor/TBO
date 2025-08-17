document.addEventListener("DOMContentLoaded", function () {
  // --- Render donation settings and forms dynamically ---
  async function fetchDonationSettings() {
    try {
              const res = await fetch('https://tbo-qyda.onrender.com/api/settings/donation');
      if (!res.ok) throw new Error('Failed to fetch donation settings');
      return await res.json();
    } catch {
      return {};
    }
  }

  function attachMpesaModalLogic() {
    const mpesaForm = document.getElementById("mpesa-form");
    const mpesaModal = document.getElementById("mpesa-modal");
    const mpesaMessage = document.getElementById("mpesa-message");
    const closeMpesaModal = document.getElementById("close-mpesa-modal");

    if (mpesaForm && mpesaModal && closeMpesaModal && mpesaMessage) {
      mpesaForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const amount = this.querySelector('input[type="number"]').value;
        if (!amount || +amount <= 0) return;

        // Show instructions
        mpesaMessage.innerHTML = `
          ✅ To donate <strong>KES ${amount}</strong>, open your M-PESA menu:<br><br>
          ➤ Go to <strong>Lipa na M-PESA</strong><br>
          ➤ Choose <strong>Paybill</strong><br>
          ➤ Enter Paybill Number: <strong>400200</strong><br>
          ➤ Account Number: <strong>01109098319900</strong><br>
          ➤ Enter Amount: <strong>KES ${amount}</strong><br><br>
          Thank you for your support! 🙏
        `;
        mpesaModal.style.display = "flex";

        // --- Log donation to backend ---
        let member = null;
        let token = null;
        try {
          member = JSON.parse(localStorage.getItem("tbo_member"));
        } catch {}
        token = localStorage.getItem("tbo_member_jwt");
        const donation = {
          date: new Date().toISOString(),
          type: "M-PESA",
          amount: Number(amount),
          from: (token && member && member.name && member.email) ? `${member.name} (${member.email})` : "Guest",
          purpose: "Support"
        };
        try {
          await fetch('https://tbo-qyda.onrender.com/api/donations/public', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donation)
          });
        } catch (err) {
          // fallback: localStorage log
          const logs = JSON.parse(localStorage.getItem("donationLogs") || "[]");
          logs.push(donation);
          localStorage.setItem("donationLogs", JSON.stringify(logs));
        }
        window.dispatchEvent(new Event('donationLogsUpdated'));
        this.reset();
      });

      closeMpesaModal.addEventListener("click", () => {
        mpesaModal.style.display = "none";
      });
      mpesaModal.addEventListener("click", (e) => {
        if (e.target === mpesaModal) mpesaModal.style.display = "none";
      });
    }
  }

  async function renderDonationSettings() {
    const settings = await fetchDonationSettings();
    // PayPal
    const paypalEmail = settings.paypal || "not set";
    const paypalLink = paypalEmail && paypalEmail !== "not set"
      ? `https://www.paypal.com/paypalme/${paypalEmail.replace(/@.*$/, '')}`
      : "#";
    // MPESA
    let paybill = "400200", account = "01109098319900";
    if (settings.mpesa) {
      const pbMatch = settings.mpesa.match(/Paybill:\s*([0-9]+)/i);
      const acMatch = settings.mpesa.match(/Account:\s*([0-9]+)/i);
      paybill = pbMatch ? pbMatch[1] : paybill;
      account = acMatch ? acMatch[1] : account;
    }
    // Message
    if (settings.message && document.querySelector('.hero > p')) {
      document.querySelector('.hero > p').textContent = settings.message;
    }
    // Render PayPal
    const paypalSection = document.querySelector('.donation-section.paypal');
    if (paypalSection) {
      paypalSection.innerHTML = `
        <h3>Donate via PayPal</h3>
        <a id="paypal-btn" href="${paypalLink}"
           target="_blank"
           rel="noopener"
           ${paypalEmail === "not set" ? 'onclick="return false;" style="pointer-events:none;opacity:0.5;"' : ''}>
          Donate with PayPal
        </a>
        <div class="donation-note">PayPal Email: ${paypalEmail}</div>
      `;
    }
    // Render MPESA
    const mpesaSection = document.querySelector('.donation-section.mpesa');
    if (mpesaSection) {
      mpesaSection.innerHTML = `
        <h3>Donate via M-PESA</h3>
        <form id="mpesa-form">
          <input type="number" min="1" required placeholder="Amount (KES)" />
          <button type="submit">Send</button>
        </form>
        <div class="mpesa-instructions">
          M-PESA Paybill: <strong>${paybill}</strong> &nbsp;|&nbsp; Account: <strong>${account}</strong>
        </div>
      `;
    }
    // After rendering, re-attach modal logic:
    attachMpesaModalLogic();

    // Attach PayPal logging
    const paypalBtn = document.getElementById('paypal-btn');
    if (paypalBtn) {
      paypalBtn.addEventListener("click", async function () {
        const loggedInEmail = localStorage.getItem("tbo_logged_user");
        const users = JSON.parse(localStorage.getItem("tbo_users") || "{}");
        const user = loggedInEmail ? users[loggedInEmail] : null;
        const donation = {
          date: new Date().toISOString(),
          type: "PayPal",
          amount: undefined, // PayPal amount is not known until after payment
          from: user ? user.name + ' (' + loggedInEmail + ')' : "Guest",
          purpose: "Support"
        };
        try {
          await fetch('https://tbo-qyda.onrender.com/api/donations/public', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donation)
          });
        } catch (err) {
          // fallback: localStorage log
          const logs = JSON.parse(localStorage.getItem("donationLogs") || "[]");
          logs.push(donation);
          localStorage.setItem("donationLogs", JSON.stringify(logs));
        }
        window.dispatchEvent(new Event('donationLogsUpdated'));
        // Continue to PayPal
      });
    }
  }

  // Initial render
  renderDonationSettings();

  // Live update on custom event
  window.addEventListener('donationSettingsUpdated', renderDonationSettings);
});
