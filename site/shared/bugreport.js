// Yakuza Tracker — unobtrusive "report a bug" widget.
// No backend: builds a mailto: link and hands it to the visitor's own
// email client. Nothing is sent from this page or stored anywhere.

var REPORT_EMAIL = 'yilver1@protonmail.com';

function build(){
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'bugreport-btn';
  btn.className = 'bugreport-btn';
  btn.textContent = 'Report a bug';

  var navLinks = document.querySelector('.site-nav-links');
  if(navLinks){
    navLinks.appendChild(btn);
  } else {
    document.body.appendChild(btn);
  }

  var dialog = document.createElement('dialog');
  dialog.id = 'bugreport-dialog';
  dialog.className = 'bugreport-dialog';
  dialog.innerHTML =
    '<form method="dialog" class="bugreport-form">' +
      '<h3>Report a bug</h3>' +
      '<label>Title<input type="text" id="bugreport-subject" required maxlength="120"></label>' +
      '<label>Your email <span class="bugreport-optional">(optional, for a reply)</span><input type="email" id="bugreport-email" placeholder="you@example.com"></label>' +
      '<label>Message<textarea id="bugreport-message" required rows="5" maxlength="2000"></textarea></label>' +
      '<p class="bugreport-note">This opens your own email app with everything filled in — nothing is sent from here.</p>' +
      '<div class="bugreport-actions">' +
        '<button type="button" id="bugreport-cancel" class="save-btn">Cancel</button>' +
        '<button type="submit" id="bugreport-send" class="save-btn">Open email</button>' +
      '</div>' +
    '</form>';

  document.body.appendChild(dialog);

  btn.addEventListener('click', function(){ dialog.showModal(); });

  dialog.addEventListener('click', function(e){
    if(e.target === dialog) dialog.close();
  });
  dialog.querySelector('#bugreport-cancel').addEventListener('click', function(){ dialog.close(); });

  dialog.querySelector('.bugreport-form').addEventListener('submit', function(e){
    e.preventDefault();
    var subject = document.getElementById('bugreport-subject').value.trim();
    var email = document.getElementById('bugreport-email').value.trim();
    var message = document.getElementById('bugreport-message').value.trim();
    if(!subject || !message) return;

    var bodyLines = [];
    if(email) bodyLines.push('Reply to: ' + email);
    bodyLines.push('Page: ' + window.location.href);
    bodyLines.push('');
    bodyLines.push(message);

    var mailto = 'mailto:' + REPORT_EMAIL +
      '?subject=' + encodeURIComponent('[RGG Tracker] ' + subject) +
      '&body=' + encodeURIComponent(bodyLines.join('\n'));

    window.location.href = mailto;
    dialog.close();
    e.target.reset();
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', build);
} else {
  build();
}
