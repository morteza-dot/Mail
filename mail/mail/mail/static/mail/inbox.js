document.addEventListener('DOMContentLoaded', function() {

  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  load_mailbox('inbox');
  document.querySelector('#compose-form').onsubmit = send_email;
});

function compose_email() {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const element = document.createElement('div');
      element.addEventListener('click', () => view_email(email.id, mailbox));
      element.className = "list-group-item border p-3 my-2 d-flex justify-content-between align-items-center";
      element.style.backgroundColor = email.read ? '#f5f5f5' : 'white';
      element.style.cursor = 'pointer';

      const recipientsList = Array.isArray(email.recipients) ? email.recipients.join(', ') : email.recipients;
      const headerText = (mailbox === 'sent') ? `To: ${recipientsList}` : email.sender;

      element.innerHTML = `
        <div>
            <strong>${headerText}</strong>
            <span class="ms-3">${email.subject}</span>
        </div>
        <span class="text-muted small">${email.timestamp}</span>
      `;

      document.querySelector('#emails-view').append(element);
    });
  });
}

function send_email(event){
  event.preventDefault();

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject : document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    load_mailbox('sent');
  });
}

function view_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

      document.querySelector('#emails-view').innerHTML = `
        <div class="card p-3">
          <h5><strong>Subject:</strong> ${email.subject}</h5>
          <p class="text-muted mb-1"><strong>From:</strong> ${email.sender}</p>
          <p class="text-muted mb-1"><strong>To:</strong> ${email.recipients.join(', ')}</p>
          <p class="text-muted"><small>${email.timestamp}</small></p>
          <hr>
          <p style="white-space: pre-wrap;">${email.body}</p>
          <hr>
          <div class="d-flex justify-content-start gap-2" id="email-buttons">
              <button class="btn btn-sm btn-outline-primary" id="reply-btn">Reply</button>
          </div>
        </div>
      `;

      if (mailbox !== 'sent') {
        const archiveBtn = document.createElement('button');
        archiveBtn.className = `btn btn-sm ${email.archived ? 'btn-outline-success' : 'btn-outline-secondary'}`;
        archiveBtn.textContent = email.archived ? 'Unarchive' : 'Archive';
        
        archiveBtn.addEventListener('click', () => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !email.archived 
            })
          })
          .then(() => {
            load_mailbox('inbox');
          });
        });

        document.querySelector('#email-buttons').append(archiveBtn);
      }

      document.querySelector('#reply-btn').addEventListener('click', () => {
          compose_email();
          document.querySelector('#compose-recipients').value = email.sender;

          let subject = email.subject;
          if (!subject.startsWith("Re:")) {
              subject = "Re: " + subject;
          }
          document.querySelector('#compose-subject').value = subject;

          document.querySelector('#compose-body').value = `\n\n----------------- On ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
      });

      if (!email.read) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true })
        });
      }
  });
}