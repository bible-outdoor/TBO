document.addEventListener("DOMContentLoaded", async function () {
      const container = document.getElementById("contact-content");
      const loggedInEmail = localStorage.getItem("tbo_logged_user");
      const users = JSON.parse(localStorage.getItem("tbo_users") || "{}");
      const user = loggedInEmail ? users[loggedInEmail] : null;

      if (user) {
        container.innerHTML = `
          <form id="contact-form" style="background:var(--sky);border-radius:1em;display:inline-block;text-align:left;max-width:380px;padding:1.5em;margin-top:1em;">
            <input type="text" name="subject" placeholder="Subject (optional)" style="width:100%;margin-bottom:1em;padding:0.7em;border-radius:1em;border:1px solid var(--soft-gray);font-size:1em;" />
            <textarea name="message" required placeholder="Your message" rows="5" style="width:100%;margin-bottom:1em;padding:0.7em;border-radius:1em;border:1px solid var(--soft-gray);font-size:1em;"></textarea>
            <button type="submit" style="background:var(--gold);color:var(--dark);border:none;border-radius:1em;font-weight:bold;padding:0.7em 2em;cursor:pointer;font-size:1em;">Send</button>
          </form>
          <div id="form-message" style="display:none; margin-top: 1em; font-size:0.95em; padding:0.6em 0.9em; border-radius:0.8em;"></div>
        `;

        const form = document.getElementById("contact-form");
        const messageBox = document.getElementById("form-message");

        form.onsubmit = function (e) {
          e.preventDefault();
          const subject = form.subject.value || "";
          const message = form.message.value.trim();

          const loggedInEmail = localStorage.getItem("tbo_logged_user");
          const users = JSON.parse(localStorage.getItem("tbo_users") || "{}");
          const user = loggedInEmail ? users[loggedInEmail] : null;

          if (user && message) {
            // Send to backend so it appears in admin panel
            fetch('https://tbo-c5wk.onrender.com/api/contacts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                subject,
                message
              })
            }).then(() => {
              form.reset();
              messageBox.textContent = "📩 Your message has been sent to the Pastor. Thank you!";
              messageBox.style.display = "block";
              messageBox.style.background = 'var(--sky)';
              messageBox.style.color = 'var(--primary)';
              messageBox.style.border = '1px solid var(--primary)';
              setTimeout(() => {
                messageBox.style.display = 'none';
              }, 6000);
            });
          }
        };
      } else {
        container.innerHTML = `
          <p style="color:var(--primary);font-weight:500;font-size:1.1em;">
            Only registered members can contact the pastor.<br>
            Please <a href="index.html#login" style="color:var(--gold);text-decoration:underline;">Login here</a> to continue.
          </p>
        `;
      }
    });