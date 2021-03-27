document.addEventListener("DOMContentLoaded", function (formevent) {
  document
    .querySelector("#compose-form")
    .addEventListener("submit", (formevent) => submit_email(formevent));

  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

// *** NEW EMAIL COMPOSITION *** //

function compose_email(email) {
  // Show compose view and hide other views
  document.querySelector("#mail-view").style.display = "none";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  console.log(email);

  if (email.sender) {
    document.querySelector("#compose-recipients").value = email.sender;
    document.querySelector("#compose-subject").value = `RE: ${email.subject}`;
    document.querySelector(
      "#compose-body"
    ).value = `On ${email.timestamp} ${email.sender} wrote: \n\n${email.body}`;
  } else {
    // Clear out composition fields
    document.querySelector("#compose-recipients").value = "";
    document.querySelector("#compose-subject").value = "";
    document.querySelector("#compose-body").value = "";
  }
}

// *** SEND NEW EMAIL ***

function submit_email(formevent) {
  formevent.preventDefault();
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  // CS50 code
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      error = result.error;
      result.error ? alert(error) : null;
    });

  load_mailbox("sent");
}

// *** MAILBOX MANAGEMENT ***

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#mail-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Fetch appropriate mailbox content

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach(add_post);
    });

  // Display mailbox content

  // Add a new post with given contents to DOM - from CS50
  function add_post(contents) {
    // Create new post
    const post = document.createElement("div");

    post.addEventListener("click", function () {
      display_email(contents.id);
    });

    post.className = "post";
    post.id = contents.id;
    contents.read
      ? (post.style.cssText = "background-color:lightgrey")
      : (post.style.cssText = "background-color:white");

    const from = document.createElement("p");
    mailbox == "sent"
      ? (from.innerHTML = contents.recipients)
      : (from.innerHTML = contents.sender);
    from.className = "from";

    const subject = document.createElement("p");
    subject.innerHTML = contents.subject;
    subject.className = "subject";

    const timestamp = document.createElement("p");
    timestamp.innerHTML = contents.timestamp;
    timestamp.className = "timestamp";

    function archive_me(event, id, status) {
      event.stopPropagation();

      fetch(`/emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          archived: !status,
        }),
      }).then(() => {
        load_mailbox("archive");
      });
    }

    if (mailbox == "inbox") {
      const abutton = document.createElement("button");
      abutton.className = "abutton";
      abutton.innerHTML = "Archive";
      abutton.addEventListener("click", function (event) {
        archive_me(event, contents.id, contents.archived);
      });

      post.appendChild(abutton);
    } else if (mailbox == "archive") {
      const abutton = document.createElement("button");
      abutton.innerHTML = "Unarchive";
      abutton.className = "abutton";
      abutton.addEventListener("click", function (event) {
        archive_me(event, contents.id, contents.archived);
      });
      post.appendChild(abutton);
    } else {
      console.log("sent");
    }

    post.appendChild(from);
    post.appendChild(subject);
    post.appendChild(timestamp);

    // Add post to DOM
    document.querySelector("#emails-view").append(post);
  }
}

//  **** DISPLAY INDIVIDUAL EMAIL ***

function display_email(id) {
  // Show the message and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#mail-view").style.display = "block";

  //clear up
  document.querySelector("#mail-view").innerHTML = "";

  //get message
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      build_email(email);
    });

  function build_email(email) {
    console.log(email);
    // Create display elements
    //create main container element
    const message = document.createElement("div");

    const subject = document.createElement("h3");
    subject.innerHTML = email.subject;

    const sender = document.createElement("p");
    sender.innerHTML = `From ${email.sender} on ${email.timestamp}`;
    sender.className = "msender";

    const recipients = document.createElement("p");
    recipients.innerHTML = `to ${email.recipients}`;
    recipients.className = "mrecipients";

    const body = document.createElement("p");
    body.innerHTML = email.body;
    body.className = "mbody";

    const reply = document.createElement("button");
    reply.className = "btn btn-sm btn-outline-primary";
    reply.innerHTML = "Reply";

    reply.addEventListener("click", function () {
      compose_email(email);
    });

    const unread = document.createElement("button");
    unread.className = "btn btn-sm btn-outline-primary";
    unread.id = "unread";
    unread.innerHTML = "Unread";

    unread.addEventListener("click", function () {
      set_unread(email);
    });

    //insert into page
    document.querySelector("#mail-view").append(message);
    message.appendChild(subject);
    message.appendChild(sender);
    message.appendChild(recipients);
    message.appendChild(body);
    message.appendChild(reply);
    message.appendChild(unread);

    //set to read
    fetch(`/emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({
        read: true,
      }),
    });
  }

  function set_unread(email) {
    fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        read: false,
      }),
    }).then(() => {
      load_mailbox("inbox");
    });
  }
}
