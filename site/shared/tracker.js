// Yakuza Tracker — helpers shared across every game's tracker page.
// Each game page defines its own trophy logic and calls these functions
// for local saving, export/import, and the generic save-row UI.

export function $(sel, root){ return (root || document).querySelector(sel); }
export function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
export function checkedCount(sel){ return $all(sel).filter(function(el){ return el.checked; }).length; }
export function numVal(id){ var el = document.getElementById(id); if(!el) return 0; var v = parseInt(el.value, 10); return isNaN(v) ? 0 : v; }
export function isChecked(id){ var el = document.getElementById(id); return !!(el && el.checked); }

function statefulInputs(){
  return $all('input[type="checkbox"][id], input[type="number"][id]');
}

/**
 * Creates a persistence handler for a tracker, namespaced by storageKey
 * (one key per game, so progress from different games never collides
 * in the same browser).
 */
export function createStorage(storageKey, downloadName){
  function collect(){
    var state = {};
    statefulInputs().forEach(function(el){
      state[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return state;
  }

  function apply(state){
    if(!state) return;
    statefulInputs().forEach(function(el){
      if(!(el.id in state)) return;
      if(el.type === 'checkbox') el.checked = !!state[el.id];
      else el.value = state[el.id];
    });
  }

  function save(onSaved){
    var state = collect();
    try{ localStorage.setItem(storageKey, JSON.stringify(state)); }catch(e){}
    if(onSaved) onSaved(new Date());
  }

  function load(){
    var raw;
    try{ raw = localStorage.getItem(storageKey); }catch(e){ raw = null; }
    if(!raw) return false;
    var state;
    try{ state = JSON.parse(raw); }catch(e){ return false; }
    apply(state);
    return true;
  }

  function exportFile(){
    var blob = new Blob([JSON.stringify(collect(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = downloadName || (storageKey + '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importFile(file, cb){
    var reader = new FileReader();
    reader.onload = function(){
      var state;
      try{ state = JSON.parse(reader.result); }
      catch(e){ alert('This file is not a valid export from this tracker.'); return; }
      apply(state);
      save();
      if(cb) cb();
    };
    reader.readAsText(file);
  }

  return { save: save, load: load, exportFile: exportFile, importFile: importFile };
}

/**
 * Wires up the standard save controls (indicator + export + import)
 * present in every tracker page's header.
 */
export function wireSaveUI(storage){
  var indicator = document.getElementById('save-indicator');
  var exportBtn = document.getElementById('export-btn');
  var importBtn = document.getElementById('import-btn');
  var importInput = document.getElementById('import-file');

  function markSaved(date){
    if(indicator) indicator.textContent = 'Saved ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  if(exportBtn) exportBtn.addEventListener('click', storage.exportFile);
  if(importBtn) importBtn.addEventListener('click', function(){ importInput && importInput.click(); });
  if(importInput) importInput.addEventListener('change', function(){
    if(importInput.files && importInput.files[0]){
      importInput.files[0].arrayBuffer && storage.importFile(importInput.files[0], function(){
        markSaved(new Date());
      });
    }
    importInput.value = '';
  });

  return { markSaved: markSaved };
}

/**
 * Wires change/input on the whole body: saves state and calls onChange
 * (each page uses this to recompute its badges/progress).
 */
export function wireAutosave(storage, onChange){
  var ui = wireSaveUI(storage);
  function handle(e){
    if(e.target && (e.target.type === 'checkbox' || e.target.type === 'number')){
      storage.save(ui.markSaved);
      if(onChange) onChange();
    }
  }
  document.body.addEventListener('change', handle);
  document.body.addEventListener('input', function(e){
    if(e.target && e.target.type === 'number') handle(e);
  });
}
