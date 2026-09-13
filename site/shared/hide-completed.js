// Yakuza Tracker — "Hide completed" toggle.
// Self-mounting: injects a button into the page's .save-actions row and
// wires it to hide every checked .item across all sections at once.
// Doesn't persist — resets to "show all" on reload, by design.

function build(){
  var actions = document.querySelector('.save-actions');
  if(!actions) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'hide-completed-btn';
  btn.className = 'save-btn';
  btn.textContent = 'Hide Completed';
  btn.setAttribute('aria-pressed', 'false');

  actions.insertBefore(btn, actions.firstChild);

  btn.addEventListener('click', function(){
    var on = document.body.classList.toggle('hide-completed');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Show Completed' : 'Hide Completed';
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', build);
} else {
  build();
}
